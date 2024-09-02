export default {
  // Note that the setting store is included in MapContent.vue
  methods: {
    downloadAndCreateImageThumbnailMarkerUrl: function(mapImp, key, list, type) {
      const count = list.length
      if (count > 0) {
        //Pick a random image
        const index = Math.floor(Math.random() * count)
        const thumbnail = list[index].thumbnail
        this.getThumbnail(thumbnail, type)
          .then((wrappedElement) => {
            this.createImageThumbnailMarkerUrl(mapImp, key, wrappedElement)
          })
          .catch(() => {
            //Failed to download, pick another one
            list.splice(index)
            this.downloadAndCreateImageThumbnailMarkerUrl(mapImp, key, list, type)
          })
      }
    },
    populateFlatmapWithImages: function (mapImp, images = [], type) {
      for (const [key, list] of Object.entries(images)) {
        this.downloadAndCreateImageThumbnailMarkerUrl(mapImp, key, list, type)     
      }
      /*
      images.forEach((image) => {
        if (image.value && image.value.length > 0)
        image.value.forEach((image) => {
          if (image.anatomy && image.anatomy.length > 0) {
            image.anatomy.forEach((anatomy) => {
              if (!anatomyList.includes(anatomy.curie) && ids.includes(anatomy.curie)) {
                console.log(anatomy.curie)
                anatomyList.push(anatomy.curie)
                this.createImageThumbnailMarkerUrl(mapImp, anatomy.curie, image.thumbnail)
              }
            })
          }
        })
      })
      */
    },
    findImagesForAnatomy: function (images = [], anatomyToFind) {
      if (anatomyToFind in images) {
        return images[anatomyToFind]
      }
      return []
      /*
      images.forEach((image) => {
        if (image.value && image.value.length > 0)
        image.value.forEach((image) => {
          if (image.anatomy && image.anatomy.length > 0) {
            image.anatomy.forEach((anatomy) => {
              if (anatomy.curie === anatomyToFind) {
                imageList.push(image)
              }
            })
          }
        })
      })
      return imageList
      */
    },
    getThumbnail: async function(url, type) {
      return new Promise((resolve, reject) => {
        if (type === "Segmentations" ||
            type === "Images") {
          this.getBinaryThumbnail(url)
            .then((response) => resolve(response))
            .catch((response) => reject(response))
        } else {
          this.getGenericThumbnail(url)
            .then((response) => resolve(response))
            .catch((response) => reject(response))
        }
      })
    },
    getBinaryThumbnail: async function(url) {
      return new Promise((resolve, reject) => {
        fetch(url)
          .then((response) => {
            if (response.status >= 200 && response.status < 300) {
              return response.text()
            } else {
              reject();
            }      
          })
          .then((data) => {
            if (data) {
              let img = new Image();
              let wrapperElement = document.createElement("div")
              img.style = "height: auto;width: 50px;margin-right: 80px;"
              img.onload = function() {
                wrapperElement.appendChild(img);
                resolve(wrapperElement);
              }
              img.onerror = function() {
                reject(new Error("Failed to load image at " + url));
              };
              img.src= `data:'image/png';base64,${data}`
            } else {
              reject(new Error("Failed to load image at " + url));
            }
          })
      })
    },
    getGenericThumbnail: async function(url) {
      return new Promise((resolve, reject) => {
        let img = new Image();
        let wrapperElement = document.createElement("div");
        img.style = "height: auto;width: 50px;margin-right: 80px;"
        img.onload = function() {
          wrapperElement.appendChild(img);
          resolve(wrapperElement);
        }
        img.onerror = function() {
          reject(new Error("Failed to load image at " + url));
        };
        img.src = url;
      });
    },
    createImageThumbnailMarkerUrl: function (mapImp, id, wrapperElement) {
      // add it to the flatmap
      const markerIdentifier = mapImp.addMarker(id, {
        element: wrapperElement,
        className: "highlight-marker",
        cluster: false,
        type: "image",
      });

      const marker = mapImp.addMarker(id);
      return marker
    }

  }
}
