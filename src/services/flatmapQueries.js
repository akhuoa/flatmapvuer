/* eslint-disable no-alert, no-console */
// remove duplicates by stringifying the objects
const removeDuplicates = function (arrayOfAnything) {
  if (!arrayOfAnything) return []
  return [...new Set(arrayOfAnything.map((e) => JSON.stringify(e)))].map((e) =>
    JSON.parse(e)
  )
}

const cachedLabels = {}
const cachedTaxonLabels = [];

const findTaxonomyLabel = async function (flatmapAPI, taxonomy) {
  if (cachedLabels && cachedLabels.hasOwnProperty(taxonomy)) {
    return cachedLabels[taxonomy]
  }

  return new Promise((resolve) => {
    fetch(`${flatmapAPI}knowledge/label/${taxonomy}`, {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((data) => {
        let label = data.label
        if (label === 'Mammalia') {
          label = 'Mammalia not otherwise specified'
        }
        cachedLabels[taxonomy] = label
        resolve(label)
      })
      .catch((error) => {
        console.error('Error:', error)
        cachedLabels[taxonomy] = taxonomy
        resolve(taxonomy)
      })
  })
}

const findTaxonomyLabels = async function (mapImp, taxonomies) {
  const intersectionTaxonomies = taxonomies.filter((taxonomy) =>
    cachedTaxonLabels.some((obj) => obj.taxon === taxonomy)
  );

  const foundCachedTaxonLabels = cachedTaxonLabels.filter((obj) =>
    intersectionTaxonomies.includes(obj.taxon)
  );

  const leftoverTaxonomies = taxonomies.filter((taxonomy) =>
    !intersectionTaxonomies.includes(taxonomy)
  );

  if (!leftoverTaxonomies.length) {
    return foundCachedTaxonLabels;
  } else {
    const entityLabels = await mapImp.queryLabels(leftoverTaxonomies);
    if (entityLabels.length) {
      entityLabels.forEach((entityLabel) => {
        let { entity: taxon, label } = entityLabel;
        if (label === 'Mammalia') {
          label = 'Mammalia not otherwise specified'
        }
        const item = { taxon, label };
        foundCachedTaxonLabels.push(item);
        cachedTaxonLabels.push(item);
      });
      return foundCachedTaxonLabels;
    }
  }
}

const inArray = function (ar1, ar2) {
  if (!ar1 || !ar2) return false
  let as1 = JSON.stringify(ar1)
  let as2 = JSON.stringify(ar2)
  return as1.indexOf(as2) !== -1
}

const compareNames = (a, b) => {
  // to make it work for both string name and obj.name
  const _nameA = a.name ?? a;
  const _nameB = b.name ?? b;
  const nameA = _nameA.toUpperCase();
  const nameB = _nameB.toUpperCase();

  if (nameA < nameB) {
    return -1;
  }

  if (nameA > nameB) {
    return 1;
  }

  return 0;
}

let FlatmapQueries = function () {
  this.initialise = function (flatmapApi) {
    this.flatmapApi = flatmapApi
    this.destinations = []
    this.origins = []
    this.components = []
    this.rawURLs = []
    this.controller = undefined
    this.uberons = []
    this.lookUp = []
  }

  this.createTooltipData = async function (mapImp, eventData) {
    let hyperlinks = []
    if (
      eventData.feature.hyperlinks &&
      eventData.feature.hyperlinks.length > 0
    ) {
      hyperlinks = eventData.feature.hyperlinks
    } else {
      hyperlinks = this.rawURLs;
    }
    let taxonomyLabel = undefined
    if (eventData.provenanceTaxonomy) {
      taxonomyLabel = []
      const entityLabels = await findTaxonomyLabels(mapImp, eventData.provenanceTaxonomy);
      if (entityLabels.length) {
        entityLabels.forEach((entityLabel) => {
          const { label } = entityLabel;
          taxonomyLabel.push(label);
        });
      }
    }

    let tooltipData = {
      destinations: this.destinations,
      origins: this.origins,
      components: this.components,
      destinationsWithDatasets: this.destinationsWithDatasets,
      originsWithDatasets: this.originsWithDatasets,
      componentsWithDatasets: this.componentsWithDatasets,
      title: eventData.label,
      featureId: eventData.resource,
      hyperlinks: hyperlinks,
      provenanceTaxonomy: eventData.provenanceTaxonomy,
      provenanceTaxonomyLabel: taxonomyLabel,
    }
    return tooltipData
  }

  this.updateTooltipData = function (tooltipEntry) {
    return {
      ...tooltipEntry,
      origins: this.origins,
      originsWithDatasets: this.originsWithDatasets,
      components: this.components,
      componentsWithDatasets: this.componentsWithDatasets,
      destinations: this.destinations,
      destinationsWithDatasets: this.destinationsWithDatasets,
    };
  }

  this.createComponentsLabelList = function (components, lookUp) {
    let labelList = []
    components.forEach((n) => {
      labelList.push(this.createLabelFromNeuralNode(n[0]), lookUp)
      if (n.length === 2) {
        labelList.push(this.createLabelFromNeuralNode(n[1]), lookUp)
      }
    })
    return labelList
  }

  this.createLabelLookup = function (mapImp, uberons) {
    return new Promise(async (resolve) => {
      let uberonMap = {}
      this.uberons = []
      const entityLabels = await findTaxonomyLabels(mapImp, uberons);
      if (entityLabels.length) {
        entityLabels.forEach((entityLabel) => {
          const { taxon: entity, label } = entityLabel;
          uberonMap[entity] = label;
          this.uberons.push({
            id: entity,
            name: label,
          })
        });
        resolve(uberonMap)
      }
    })
  }

  this.buildConnectivitySqlStatement = function (keastIds) {
    let sql = 'select knowledge from knowledge where entity in ('
    if (keastIds.length === 1) {
      sql += `'${keastIds[0]}')`
    } else if (keastIds.length > 1) {
      for (let i in keastIds) {
        sql += `'${keastIds[i]}'${i >= keastIds.length - 1 ? ')' : ','} `
      }
    }
    return sql
  }

  this.buildLabelSqlStatement = function (uberons) {
    let sql = 'select entity, label from labels where entity in ('
    if (uberons.length === 1) {
      sql += `'${uberons[0]}')`
    } else if (uberons.length > 1) {
      for (let i in uberons) {
        sql += `'${uberons[i]}'${i >= uberons.length - 1 ? ')' : ','} `
      }
    }
    return sql
  }

  this.findAllIdsFromConnectivity = function (connectivity) {
    let dnodes = connectivity.connectivity.flat() // get nodes from edgelist
    let nodes = [...new Set(dnodes)] // remove duplicates
    let found = []
    nodes.forEach((n) => {
      if (Array.isArray(n)) {
        found.push(n.flat())
      } else {
        found.push(n)
      }
    })
    return [...new Set(found.flat())]
  }

  this.flattenConnectivity = function (connectivity) {
    let dnodes = connectivity.flat() // get nodes from edgelist
    let nodes = [...new Set(dnodes)] // remove duplicates
    let found = []
    nodes.forEach((n) => {
      if (Array.isArray(n)) {
        found.push(n.flat())
      } else {
        found.push(n)
      }
    })
    return found.flat()
  }

  this.findComponents = function (connectivity, axons, dendrites, somas) {
    let dnodes = connectivity.connectivity.flat() // get nodes from edgelist
    let nodes = removeDuplicates(dnodes)

    let found = []
    let terminal = false
    nodes.forEach((node) => {
      terminal = false
      // Check if the node is an destination or origin (note that they are labelled dendrite and axon as opposed to origin and destination)
      if (inArray(axons, node)) {
        terminal = true
      }
      if (somas && inArray(somas, node)) {
        terminal = true
      }
      if (inArray(dendrites, node)) {
        terminal = true
      }
      if (!terminal) {
        found.push(node)
      }
    })

    return found
  }

  this.retrieveFlatmapKnowledgeForEvent = async function (mapImp, eventData) {
    // check if there is an existing query
    if (this.controller) this.controller.abort()

    // set up the abort controller
    this.controller = new AbortController()
    const signal = this.controller.signal

    const keastIds = eventData.resource
    this.destinations = []
    this.origins = []
    this.components = []
    this.rawURLs = []
    if (!keastIds || keastIds.length == 0 || !keastIds[0]) return

    // set connectivity source if available
    const connectivitySource = localStorage.getItem('connectivity-source');

    let prom1 = this.queryForConnectivityNew(mapImp, keastIds, signal, connectivitySource) // This on returns a promise so dont need 'await'
    let results = await Promise.all([prom1])
    return results
  }

  this.queryForConnectivityNew = function (mapImp, keastIds, signal, connectivitySource, processConnectivity=true) {
    return new Promise((resolve) => {
      const mapuuid = mapImp.provenance.uuid;
      const queryAPI = connectivitySource === 'map'
                        ? this.queryMapConnectivity(mapuuid, keastIds[0])
                        : mapImp.queryKnowledge(keastIds[0]);

      queryAPI
        .then((response) => {
          if (this.checkConnectivityExists(response)) {
            let connectivity = response;
            if (processConnectivity) {
              this.processConnectivity(mapImp, connectivity).then((processedConnectivity) => {
                // response.references is publication urls
                if (response.references) {
                  // with publications from both PubMed and Others
                  this.rawURLs = [...response.references];
                  resolve(processedConnectivity)
                } else {
                  // without publications
                  resolve(processedConnectivity)
                }
              })
            }
            else resolve(connectivity)
          } else {
            resolve(false)
          }
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            // This error is from AbortController's abort method.
          } else {
            // console.error('Error:', error)
            // TODO: to update after queryKnowledge method update
            console.warn(`Unable to get the knowledge for the entity ${keastIds[0]}.`)
          }
          resolve(false)
        })
    })
  }

  this.queryMapConnectivity = async function (mapuuid, pathId) {
    const url = this.flatmapApi + `flatmap/${mapuuid}/connectivity/${pathId}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error);
    }
  },

  this.queryForConnectivity = function (mapImp, keastIds, signal, processConnectivity=true) {
    const data = { sql: this.buildConnectivitySqlStatement(keastIds) }
    const headers = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...(signal ? { signal: signal } : {}), // add signal to header if it exists
    }
    return new Promise((resolve) => {
      fetch(`${this.flatmapApi}knowledge/query/`, headers)
        .then((response) => response.json())
        .then((data) => {
          if (this.connectivityExists(data)) {
            let connectivity = JSON.parse(data.values[0][0])
            if (processConnectivity) {
              this.processConnectivity(mapImp, connectivity).then((processedConnectivity) => {
                resolve(processedConnectivity)
              })
            }
            else resolve(connectivity)
          } else {
            resolve(false)
          }
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            // This error is from AbortController's abort method.
          } else {
            console.error('Error:', error)
          }
          resolve(false)
        })
    })
  }

  this.checkConnectivityExists = function (data) {
    return data && data.connectivity?.length;
  };

  this.connectivityExists = function (data) {
    if (
      data.values &&
      data.values.length > 0 &&
      JSON.parse(data.values[0][0]).connectivity &&
      JSON.parse(data.values[0][0]).connectivity.length > 0
    ) {
      return true
    } else {
      return false
    }
  }

  // This function is used to determine if a node is a single node or a node with multiple children
  //  Returns the id of the node if it is a single node, otherwise returns false
  this.findIfNodeIsSingle = function (node) {
    if (node.length === 1) { // If the node is in the form [id]
      console.error("Server returns a single node", node)
      return node[0]
    } else {
      if (node.length === 2 && node[1].length === 0) { // If the node is in the form [id, []]
        return node[0]
      } else {
        return false // If the node is in the form [id, [id1, id2]]
      }
    }
  }

  this.createLabelFromNeuralNode = function (node, lookUp) {

    // Check if the node is a single node or a node with multiple children
    let nodeIsSingle = this.findIfNodeIsSingle(node)

    // Case where node is in the form [id]
    if (nodeIsSingle) {
      return lookUp[nodeIsSingle]
    }

    // Case where node is in the form [id, [id1 (,id2)]]
    let label = lookUp[node[0]]
    if (node.length === 2 && node[1].length > 0) {
      node[1].forEach((n) => {
        if (lookUp[n] == undefined) {
          label += `, ${n}`
        } else {
          label += `, ${lookUp[n]}`
        }
      })
    }
    return label
  }

  this.flattenAndFindDatasets = function (dendrites, components, axons) {
    // process the nodes for finding datasets (Note this is not critical to the tooltip, only for the 'search on components' button)
    let dendritesFlat = this.flattenConnectivity(dendrites)
    let componentsFlat = this.flattenConnectivity(components)
    let axonsFlat = this.flattenConnectivity(axons)

    // Filter for the anatomy which is annotated on datasets
    this.originsWithDatasets = this.uberons.filter(
      (ub) => dendritesFlat.indexOf(ub.id) !== -1
    ).sort(compareNames);
    this.componentsWithDatasets = this.uberons.filter(
      (ub) => componentsFlat.indexOf(ub.id) !== -1
    ).sort(compareNames);
    this.destinationsWithDatasets = this.uberons.filter(
      (ub) => axonsFlat.indexOf(ub.id) !== -1
    ).sort(compareNames);
  }

  this.processConnectivity = function (mapImp, connectivity) {
    return new Promise((resolve) => {
      let dendrites = []
      let axons = []
      let somas = undefined
      if (connectivity && connectivity["node-phenotypes"]) {
        const sourceKey = ["ilxtr:hasSomaLocatedIn"]
        const destinationKey = ["ilxtr:hasAxonPresynapticElementIn", "ilxtr:hasAxonSensorySubcellularElementIn"]
        sourceKey.forEach((key)=>{
          dendrites.push(...connectivity["node-phenotypes"][key])
        })
        dendrites = removeDuplicates(dendrites)
        destinationKey.forEach((key)=>{
          axons.push(...connectivity["node-phenotypes"][key])
        })
        axons = removeDuplicates(axons)
      } else {
        // Remove duplicates
        axons = removeDuplicates(connectivity.axons)
        //Somas will become part of origins, support this for future proof
        if (connectivity.somas && connectivity.somas.length > 0) {
          dendrites.push(...connectivity.somas)
        }
        if (connectivity.dendrites && connectivity.dendrites.length > 0) {
          dendrites.push(...connectivity.dendrites)
        }
        dendrites = removeDuplicates(dendrites)
        somas = connectivity.somas
      }

      const components = this.findComponents(connectivity, axons, dendrites, somas)
      // Create list of ids to get labels for
      const conIds = this.findAllIdsFromConnectivity(connectivity)
      // Create readable labels from the nodes. Setting this to 'this.origins' updates the display
      this.createLabelLookup(mapImp, conIds).then((lookUp) => {
        this.origins = dendrites.map((d) =>
          this.createLabelFromNeuralNode(d, lookUp)
        ).sort(compareNames);
        this.components = components.map((c) =>
          this.createLabelFromNeuralNode(c, lookUp)
        ).sort(compareNames);
        this.destinations = axons.map((a) =>
          this.createLabelFromNeuralNode(a, lookUp)
        ).sort(compareNames);
        this.flattenAndFindDatasets(dendrites, components, axons)
        resolve({
          ids: {
            dendrites: dendrites,
            components: components,
            axons: axons,
          },
          labels: {
            origins: this.origins,
            components: this.components,
            destinations: this.destinations,
          }
        })
      })
    })
  }

  this.buildPubmedSqlStatement = function (keastIds) {
    let sql = 'select distinct publication from publications where entity in ('
    if (keastIds.length === 1) {
      sql += `'${keastIds[0]}')`
    } else if (keastIds.length > 1) {
      for (let i in keastIds) {
        sql += `'${keastIds[i]}'${i >= keastIds.length - 1 ? ')' : ','} `
      }
    }
    return sql
  }

  this.buildPubmedSqlStatementForModels = function (model) {
    return `select distinct publication from publications where entity = '${model}'`
  }

  this.flatmapQuery = function (sql) {
    const data = { sql: sql }
    return fetch(`${this.flatmapApi}knowledge/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .catch((error) => {
        console.error('Error:', error)
      })
  }
}

export { FlatmapQueries, findTaxonomyLabel, findTaxonomyLabels }
