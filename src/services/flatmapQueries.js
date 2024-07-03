/* eslint-disable no-alert, no-console */
// remove duplicates by stringifying the objects
const removeDuplicates = function (arrayOfAnything) {
  if (!arrayOfAnything) return []
  return [...new Set(arrayOfAnything.map((e) => JSON.stringify(e)))].map((e) =>
    JSON.parse(e)
  )
}

const cachedLabels = {}

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

const inArray = function (ar1, ar2) {
  if (!ar1 || !ar2) return false
  let as1 = JSON.stringify(ar1)
  let as2 = JSON.stringify(ar2)
  return as1.indexOf(as2) !== -1
}

let FlatmapQueries = function () {
  this.initialise = function (flatmapApi) {
    this.flatmapApi = flatmapApi
    this.destinations = []
    this.origins = []
    this.components = []
    this.urls = []
    this.controller = undefined
    this.uberons = []
    this.lookUp = []
  }

  this.createTooltipData = async function (eventData) {
    let hyperlinks = []
    if (
      eventData.feature.hyperlinks &&
      eventData.feature.hyperlinks.length > 0
    ) {
      hyperlinks = eventData.feature.hyperlinks
    } else {
      hyperlinks = this.urls.map((url) => ({ url: url, id: 'pubmed' }))
    }
    let taxonomyLabel = undefined
    if (eventData.provenanceTaxonomy) {
      taxonomyLabel = []
      for (let i = 0; eventData.provenanceTaxonomy.length > i; i++) {
        taxonomyLabel.push(
          await findTaxonomyLabel(
            this.flatmapAPI,
            eventData.provenanceTaxonomy[i]
          )
        )
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

  this.createLabelLookup = function (uberons) {
    return new Promise((resolve) => {
      let uberonMap = {}
      this.uberons = []
      const data = { sql: this.buildLabelSqlStatement(uberons) }
      fetch(`${this.flatmapApi}knowledge/query/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((payload) => {
          const entity = payload.keys.indexOf('entity')
          const label = payload.keys.indexOf('label')
          if (entity > -1 && label > -1) {
            payload.values.forEach((pair) => {
              uberonMap[pair[entity]] = pair[label]
              this.uberons.push({
                id: pair[entity],
                name: pair[label],
              })
            })
          }
          resolve(uberonMap)
        })
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

  this.flattenConntectivity = function (connectivity) {
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

  this.findComponents = function (connectivity) {
    let dnodes = connectivity.connectivity.flat() // get nodes from edgelist
    let nodes = removeDuplicates(dnodes)

    let found = []
    let terminal = false
    nodes.forEach((node) => {
      terminal = false
      // Check if the node is an destination or origin (note that they are labelled dendrite and axon as opposed to origin and destination)
      if (inArray(connectivity.axons, node)) {
        terminal = true
      }
      if (inArray(connectivity.dendrites, node)) {
        terminal = true
      }
      if (!terminal) {
        found.push(node)
      }
    })

    return found
  }

  this.retrieveFlatmapKnowledgeForEvent = async function (eventData) {
    // check if there is an existing query
    if (this.controller) this.controller.abort()

    // set up the abort controller
    this.controller = new AbortController()
    const signal = this.controller.signal

    const keastIds = eventData.resource
    this.destinations = []
    this.origins = []
    this.components = []
    if (!keastIds || keastIds.length == 0) return
    
    let prom1 = this.queryForConnectivity(keastIds, signal) // This on returns a promise so dont need 'await'
    let prom2 = await this.pubmedQueryOnIds(eventData)
    let results = await Promise.all([prom1, prom2])
    return results
  }

  this.queryForConnectivity = function (keastIds, signal, processConnectivity=true) {
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
              this.processConnectivity(connectivity).then((processedConnectivity) => {
                resolve(processedConnectivity)
              })
            }
            else resolve(connectivity)
          } else {
            resolve(false)
          }
        })
        .catch((error) => {
          console.error('Error:', error)
          resolve(false)
        })
    })
  }

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

  this.flattenAndFindDatasets = function (components, axons, dendrites) {
    // process the nodes for finding datasets (Note this is not critical to the tooltip, only for the 'search on components' button)
    let componentsFlat = this.flattenConntectivity(components)
    let axonsFlat = this.flattenConntectivity(axons)
    let dendritesFlat = this.flattenConntectivity(dendrites)

    // Filter for the anatomy which is annotated on datasets
    this.destinationsWithDatasets = this.uberons.filter(
      (ub) => axonsFlat.indexOf(ub.id) !== -1
    )
    this.originsWithDatasets = this.uberons.filter(
      (ub) => dendritesFlat.indexOf(ub.id) !== -1
    )
    this.componentsWithDatasets = this.uberons.filter(
      (ub) => componentsFlat.indexOf(ub.id) !== -1
    )
  }

  this.processConnectivity = function (connectivity) {
    return new Promise((resolve) => {
      // Filter the origin and destinations from components
      let components = this.findComponents(connectivity)

      // Remove duplicates
      let axons = removeDuplicates(connectivity.axons)
      let dendrites = removeDuplicates(connectivity.dendrites)

      // Create list of ids to get labels for
      let conIds = this.findAllIdsFromConnectivity(connectivity)

      // Create readable labels from the nodes. Setting this to 'this.origins' updates the display
      this.createLabelLookup(conIds).then((lookUp) => {
        this.destinations = axons.map((a) =>
          this.createLabelFromNeuralNode(a, lookUp)
        )
        this.origins = dendrites.map((d) =>
          this.createLabelFromNeuralNode(d, lookUp)
        )
        this.components = components.map((c) =>
          this.createLabelFromNeuralNode(c, lookUp)
        )
        this.flattenAndFindDatasets(components, axons, dendrites)
        resolve({
          ids: {
            axons: axons,
            dendrites: dendrites,
            components: components,
          },
          labels: {
            destinations: this.destinations,
            origins: this.origins,
            components: this.components,
          }
        })
      })
    })
  }

  this.flattenConntectivity = function (connectivity) {
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

  this.stripPMIDPrefix = function (pubmedId) {
    return pubmedId.split(':')[1]
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
  // Note that this functin WILL run to the end, as it doesn not catch the second level of promises
  this.pubmedQueryOnIds = function (eventData) {
    return new Promise((resolve) => {
      const keastIds = eventData.resource
      const source = eventData.feature.source
      if (!keastIds || keastIds.length === 0) return
      const sql = this.buildPubmedSqlStatement(keastIds)
      this.flatmapQuery(sql).then((data) => {
        // Create pubmed url on paths if we have them
        if (data.values.length > 0) {
          this.urls = [
            this.pubmedSearchUrl(
              data.values.map((id) => this.stripPMIDPrefix(id[0]))
            ),
          ]
          resolve(true)
        } else {
          // Create pubmed url on models
          this.pubmedQueryOnModels(source).then((result) => {
            resolve(result)
          })
        }
      })
    })
  }

  this.pubmedQueryOnModels = function (source) {
    return this.flatmapQuery(
      this.buildPubmedSqlStatementForModels(source)
    ).then((data) => {
      if (Array.isArray(data.values) && data.values.length > 0) {
        this.urls = [
          this.pubmedSearchUrl(
            data.values.map((id) => this.stripPMIDPrefix(id[0]))
          ),
        ]
        return true
      } else {
        this.urls = [] // Clears the pubmed search button
      }
      return false
    })
  }

  this.pubmedSearchUrl = function (ids) {
    let url = 'https://pubmed.ncbi.nlm.nih.gov/?'
    let params = new URLSearchParams()
    params.append('term', ids)
    return url + params.toString()
  }
}

export { FlatmapQueries, findTaxonomyLabel }
