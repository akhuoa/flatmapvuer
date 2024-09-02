/* eslint-disable no-alert, no-console */
const imageQuery = '"*jp2* OR *vnd.ome.xml* OR *jpx*"';

const getBiolucidaInfo = async (sparcAPI, datasetId) => {
  return new Promise((resolve, reject) => {
    const endpoint = `${sparcAPI}/image_search/${datasetId}`
    fetch(endpoint)
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          return response.json();
        } else {
          reject();
        }      
      })
      .then((data) => {
        if (data.status == 'success') {
          resolve(data);
        } else {
          reject();
        }
      })
  })
}

const getFilesInfo = async (api, key, idsList, types) => {
  let params = new URLSearchParams();
  types.forEach((type) => {
    params.append('arrayparams', type);
    params.append('arrayparams', type);
  });
  let response = await fetch(`${api}/get-organ-curies/?${params}`);
  let data = await response.json();
  const identifiers = [];
  data.uberon.array.forEach(pair => {
    const identifier = {
      id: pair.id.toUpperCase(),
      name: pair.name
    };
    if (idsList.includes(identifier[key])) {
      identifiers.push(identifier);
    }
  });
  const keys = identifiers.map((item) => item[key]);
  response = await fetch(`${api}/get-files-info-for-curies`, {
    method: "POST",
    body: JSON.stringify(
      {
        filetypes: types,
        curies: keys,
      }
    ),
    headers: {
      "Content-Type": "application/json",
    },
  });
  data = await response.json();
  return data;
}

export default {
  // Note that the setting store is included in MapContent.vue
  methods: {
    getThumbnailURL: function(thumbnailId) {
      return `${this.sparcAPI}/thumbnail/${thumbnailId}`
    },
    getSegmentationThumbnailURL: function(datasetId, datasetVersion, filePath) {
      return `${this.sparcAPI}/thumbnail/neurolucida?datasetId=${datasetId}&version=${datasetVersion}&path=files/${filePath}`;
    },
    getBiolucidaThumbnails: async function (key, idsList) {
      try {
        const data = await getFilesInfo(this.sparcAPI, key, idsList, ["biolucida-2d", "biolucida-3d"]);
        if (data['files_info']) {
          const images = {};
          for (const [key, value] of Object.entries(data['files_info'])) {
            if (value.length > 0) {
              const list = [];
              value.forEach((entry) => {
                if (entry.biolucida_id) {
                  let image = {
                    thumbnail: this.getThumbnailURL(entry.biolucida_id),
                    datasetId: entry.id,
                  }
                  list.push(image);
                }
              });
              images[key] = list;
            }
          }
          return images;
        }
      } catch (error) {
        console.error('Error:', error);
      }
      return {};
    },
    //Get representative segmentations thumbnails
    //  key - can either be
    //    id - use the uberon id as key or
    //    name - anatomical name as key
    //  idsList - Only id / name from the server matching the one in this list
    // will be used
    getSegmentationsThumbnails: async function (key, idsList) {
      try {
        const data = await getFilesInfo(this.sparcAPI, key, idsList, ["mbf-segmentation"]);
        if (data['files_info']) {
          const images = {};
          for (const [key, value] of Object.entries(data['files_info'])) {
            if (value.length > 0) {
              const list = [];
              value.forEach((entry) => {
                let image = {
                  thumbnail: this.getSegmentationThumbnailURL(entry.id,
                    entry.version, entry.file_path),
                  datasetId: entry.id,
                }
                list.push(image);
              });
              images[key] = list;
            }
          }
          return images;
        }
      } catch (error) {
        console.error('Error:', error);
      }
      return {};
    },
    getImagesFromScicrunch: async function () {
      try {
        const response = await fetch(`${this.sparcAPI}/multiple_dataset_info/using_multiple_mimetype/?${new URLSearchParams({q: imageQuery})}`);
        const data = await response.json();
        
        console.log('number of hits:', data.numberOfHits);
        if (data.numberOfHits >= 1) {
          let images = await this.processResults(data.results);
          return {success: true, images: images};
        }
        return {success: false};
      } catch (error) {
        console.error('Error:', error);
        return {success: false};
      }
    },
    
    processResults: async function (results) {
      try {
        let images = [];
        const dataType = 'segmentation';
        console.log('starting promise list')
        let promiseList = results.map(async (result, i) => {
          const datasetId = result.dataset_identifier;
          const datasetVersion = result.dataset_version;
          const s3uri = result.s3uri;
          const biolucidaInfo = await getBiolucidaInfo(this.sparcAPI, datasetId);
          return biolucidaInfo.dataset_images.map(bioImage => {
            return {
              resource: {
                share_link: bioImage.share_link,
              },
              title: 'Image',
              anatomy: result.organs,
              species: result.organisms,
              datasetId: datasetId,
              datasetVersion: datasetVersion,
              link: bioImage.share_link,
              s3uri: s3uri,
              type: dataType,
              thumbnail: bioImage.thumbnail_url,
            };
          });
        });
        console.log('promiseList:', promiseList);
        let biolucidaInfos = await Promise.allSettled(promiseList);
        images = biolucidaInfos.flat();
        console.log('biolucidaInfos:', biolucidaInfos);
        console.log('finished!')
        return images;
      } catch (error) {
        console.error('Error:', error);
        return [];
      }
    } 
  }
}
  