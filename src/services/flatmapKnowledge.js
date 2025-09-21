import {
  findPathsByOriginItem,
  findPathsByDestinationItem,
  findPathsByViaItem,
} from '@abi-software/map-utilities';

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
  const response = await flatmapQueries.queryKnowledge(sql);
  const parsedData = response.map((x) => JSON.parse(x));
  const featureIds = parsedData.map((x) => x.id);
  return featureIds;
}

function getFlatmapKnowledge() {
  const flatmapKnowledgeRaw = sessionStorage.getItem('flatmap-knowledge');

  if (flatmapKnowledgeRaw) {
    const flatmapKnowledge = JSON.parse(flatmapKnowledgeRaw);
    return flatmapKnowledge;
  }
  return [];
}

async function filterPathsByOriginFromKnowledge(resource) {
  const flatmapKnowledge = getFlatmapKnowledge();
  const results = findPathsByOriginItem(flatmapKnowledge, resource);
  if (Array.isArray(results)) {
    return results.map(x => x.id);
  }
  return [];
}

async function filterPathsByDestinationFromKnowledge(resource) {
  const flatmapKnowledge = getFlatmapKnowledge();
  const results = findPathsByDestinationItem(flatmapKnowledge, resource);
  if (Array.isArray(results)) {
    return results.map(x => x.id);
  }
  return [];
}

async function filterPathsByViaFromKnowledge(resource) {
  const flatmapKnowledge = getFlatmapKnowledge();
  const results = findPathsByViaItem(flatmapKnowledge, resource);
  if (Array.isArray(results)) {
    return results.map(x => x.id);
  }
  return [];
}

function getKnowledgeSource(mapImp) {
  return getKnowledgeSourceFromProvenance(mapImp.provenance);
}

function getKnowledgeSourceFromProvenance(provenance) {
  let mapKnowledgeSource = '';
  if (provenance?.connectivity) {
    const sckanProvenance = provenance.connectivity;
    if ('knowledge-source' in sckanProvenance) {
      mapKnowledgeSource = sckanProvenance['knowledge-source'];
    } else if ('npo' in sckanProvenance) {
      mapKnowledgeSource = `${sckanProvenance.npo.release}-npo`;
    }
  }
  return mapKnowledgeSource;
}

async function loadAndStoreKnowledge(mapImp, flatmapQueries) {
  const knowledgeSource = getKnowledgeSource(mapImp);
  const sql = `select knowledge from knowledge
    where source="${knowledgeSource}"
    order by source desc`;

  refreshFlatmapKnowledgeCache()
  const flatmapKnowledge = sessionStorage.getItem('flatmap-knowledge');
  const flatmapKnowledgeSource = sessionStorage.getItem('flatmap-knowledge-source');

  if (!flatmapKnowledge || flatmapKnowledgeSource !== knowledgeSource) {
    const response = await flatmapQueries.queryKnowledge(sql);
    const parsedData = response.map(x => JSON.parse(x));

    sessionStorage.setItem('flatmap-knowledge', JSON.stringify(parsedData));
    sessionStorage.setItem('flatmap-knowledge-source', knowledgeSource);
    updateFlatmapKnowledgeCache();

    return parsedData;
  }
  return JSON.parse(flatmapKnowledge);
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
  getKnowledgeSourceFromProvenance,
  refreshFlatmapKnowledgeCache,
  filterPathsByOriginFromKnowledge,
  filterPathsByDestinationFromKnowledge,
  filterPathsByViaFromKnowledge,
}
