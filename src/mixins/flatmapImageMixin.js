export default {
  // Note that the setting store is included in MapContent.vue
  methods: {
    populateFlatmapWithImages: function (mapImp, images = []) {
      let anatomyList = []
      console.log('images in populateflatmap', images)
      images.forEach((image) => {
        if (image.value && image.value.length > 0)
        image.value.forEach((image) => {
          if (image.anatomy && image.anatomy.length > 0) {
            image.anatomy.forEach((anatomy) => {
              if (!anatomyList.includes(anatomy.curie)) {
                anatomyList.push(anatomy.curie)
                this.createImageThumbnailMarkerUrl(mapImp, anatomy.curie, image.thumbnail)
              }
            })
          }
        })
      })
    },
    findImagesForAnatomy: function (images = [], anatomyToFind) {
      let imageList = []
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
    },
    createImageThumbnailMarkerUrl: function (mapImp, id, image) {
      return new Promise((resolve, reject) => {
        // create the image element
        let wrapperElement = document.createElement("div");

        // download image:
        let img = new Image();
        img.src = image;
        img.style = "height: auto;width: 50px;margin-right: 80px;"
        img.onload = function() {
        wrapperElement.appendChild(img);

        // add it to the flatmap
        const markerIdentifier = mapImp.addMarker(id, {
          element: wrapperElement,
          className: "highlight-marker",
          cluster: false,
          type: "image",
        });

        const marker = mapImp.addMarker(id);
        resolve(marker);
        };

        img.onerror = function() {
        reject(new Error("Failed to load image at " + image));
        };
      });
    },
  }
}
