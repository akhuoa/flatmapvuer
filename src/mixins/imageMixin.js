export default {
  methods: {
    populateMapWithImages: function (mapImp, images, type) {
      this.downloadImageKeys = []; // to count downloaded images
      for (const [key, list] of Object.entries(images)) {
        this.downloadImageThumbnail(mapImp, key, list, type);
      }
    },
    downloadImageThumbnail: function (mapImp, key, list, type) {
      const count = list.length;

      if (!this.downloadImageKeys.includes(key)) {
        this.downloadImageKeys.push(key);
      }

      if (count > 0) {
        //Pick a random image
        const index = Math.floor(Math.random() * count);
        const thumbnail = list[index].thumbnail;
        this.getThumbnail(thumbnail, type)
          .then((wrapperElement) => {
            this.downloadImageKeys = this.downloadImageKeys.filter((item) => item !== key);
            this.addImageThumbnailMarker(mapImp, key, wrapperElement);

            // All images are downloaded
            if (!this.downloadImageKeys.length) {
              this.imagesDownloading = false;
            }
          })
          .catch(() => {
            //Failed to download, pick another one
            list.splice(index);
            this.downloadImageThumbnail(mapImp, key, list, type);
          });
      } else {
        if (this.downloadImageKeys.includes(key)) {
          this.downloadImageKeys = this.downloadImageKeys.filter((item) => item !== key);

          // Failed to download, the last item
          if (!this.downloadImageKeys.length) {
            this.imagesDownloading = false;
          }
        }
      }
    },
    getThumbnail: async function (url, type) {
      return new Promise((resolve, reject) => {
        if (type === "Image" || type === "Segmentation") {
          this.getBinaryThumbnail(url)
            .then((response) => resolve(response))
            .catch((response) => reject(response));
        } else {
          this.getGenericThumbnail(url)
            .then((response) => resolve(response))
            .catch((response) => reject(response));
        }
      });
    },
    getBinaryThumbnail: async function (url) {
      return new Promise((resolve, reject) => {
        fetch(url)
          .then((response) => {
            if (response.status >= 200 && response.status < 300) {
              return response.text();
            } else {
              reject();
            }
          })
          .then((data) => {
            if (data) {
              let img = new Image();
              let wrapperElement = document.createElement("div");
              img.style = "height: auto;width: 50px;margin-right: 80px;";
              img.onload = function () {
                wrapperElement.appendChild(img);
                resolve(wrapperElement);
              };
              img.onerror = function () {
                reject(new Error("Failed to load image at " + url));
              };
              img.src = `data:'image/png';base64,${data}`;
            } else {
              reject(new Error("Failed to load image at " + url));
            }
          });
      });
    },
    getGenericThumbnail: async function (url) {
      return new Promise((resolve, reject) => {
        let img = new Image();
        let wrapperElement = document.createElement("div");
        img.style = "height: auto;width: 50px;margin-right: 80px;";
        img.onload = function () {
          wrapperElement.appendChild(img);
          resolve(wrapperElement);
        };
        img.onerror = function () {
          reject(new Error("Failed to load image at " + url));
        };
        img.src = url;
      });
    },
    addImageThumbnailMarker: function (mapImp, id, wrapperElement) {
      const markerIdentifier = mapImp.addMarker(id, {
        element: wrapperElement,
        className: "highlight-marker",
        cluster: false,
        type: "image",
      });
    },
  },
};
