async function getReferenceConnectivitiesFromStorage(resource) {
  const flatmapKnowledgeRaw = sessionStorage.getItem('flatmap-knowledge');

  if (flatmapKnowledgeRaw) {
    const flatmapKnowledge = JSON.parse(flatmapKnowledgeRaw);
    const dataWithRefs = flatmapKnowledge.filter((x) => x.references && x.references.length);
    const foundData = dataWithRefs.filter((x) => x.references.includes(resource));

    if (foundData.length) {
      const featureIds = foundData.map((x) => x.id);
      return featureIds;
    }
  }
  return [];
}

async function getReferenceConnectivitiesByAPI(mapImp, resource, flatmapQueries) {
  const knowledgeSource = getKnowledgeSource(mapImp);
  const sql = `select knowledge from knowledge
    where source="${knowledgeSource}" and
    knowledge like "%${resource}%" order by source desc`;
  const response = await flatmapQueries.flatmapQuery(sql);
  const mappedData = response.values.map((x) => x[0]);
  const parsedData = mappedData.map((x) => JSON.parse(x));
  const featureIds = parsedData.map((x) => x.id);
  return featureIds;
}

function getKnowledgeSource(mapImp) {
  let mapKnowledgeSource = '';
  if (mapImp.provenance?.connectivity) {
    const sckanProvenance = mapImp.provenance.connectivity;
    if ('knowledge-source' in sckanProvenance) {
      mapKnowledgeSource = sckanProvenance['knowledge-source'];
    } else if ('npo' in sckanProvenance) {
      mapKnowledgeSource = `${sckanProvenance.npo.release}-npo`;
    }
  }

  return mapKnowledgeSource;
}

function loadAndStoreKnowledge(mapImp, flatmapQueries) {
  const knowledgeSource = getKnowledgeSource(mapImp);
  const sql = `select knowledge from knowledge
    where source="${knowledgeSource}"
    order by source desc`;
  const flatmapKnowledge = sessionStorage.getItem('flatmap-knowledge');
  const flatmapKnowledgeSource = sessionStorage.getItem('flatmap-knowledge-source');

  if (!flatmapKnowledge || flatmapKnowledgeSource !== knowledgeSource) {
    flatmapQueries.flatmapQuery(sql).then((response) => {
      const mappedData = response.values.map(x => x[0]);
      const parsedData = mappedData.map(x => JSON.parse(x));
      sessionStorage.setItem('flatmap-knowledge', JSON.stringify(parsedData));
      sessionStorage.setItem('flatmap-knowledge-source', knowledgeSource);
      updateFlatmapKnowledgeCache();
    });
  }
}

function updateFlatmapKnowledgeCache() {
  const CACHE_LIFETIME = 24 * 60 * 60 * 1000; // One day
  const now = new Date();
  const expiry = now.getTime() + CACHE_LIFETIME;

  sessionStorage.setItem('flatmap-knowledge-expiry', expiry);
}

function removeFlatmapKnowledgeCache() {
  const keys = [
    'flatmap-knowledge',
    'flatmap-knowledge-expiry',
    'flatmap-knowledge-source',
  ];
  keys.forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

function refreshFlatmapKnowledgeCache() {
  const expiry = sessionStorage.getItem('flatmap-knowledge-expiry');
  const now = new Date();

  if (now.getTime() > expiry) {
    removeFlatmapKnowledgeCache();
  }
}

export {
  getReferenceConnectivitiesFromStorage,
  getReferenceConnectivitiesByAPI,
  loadAndStoreKnowledge,
  getKnowledgeSource,
  refreshFlatmapKnowledgeCache,
}
