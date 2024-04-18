<template>
  <div class="image-dialog" v-if="imageIframeOpen">
    <div class="map-iframe-container">
      <iframe
        class="my-iframe"
        :src="imageIframeURL">
      </iframe>
    </div>
    <button
      class="image-dialog-close"
      @click="closeImageIframe"
      aria-label="Close"
    >
      ×
    </button>
  </div>
</template>

<script>
  export default {
    name: 'IframeImageDialog',
    props: {
      imageIframeOpen: false,
      imageIframeURL: ''
    },
    methods: {
      closeImageIframe: function () {
        this.$emit('closeImageIframe')
      },
    }
  }
</script>

<style lang="scss" scoped>
  .image-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(#000, 0.9);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;

    .image-dialog-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 30px;
      height: 30px;
      font-size: 32px;
      line-height: 1;
      padding: 0;
      border: 0 none;
      border-radius: 2px;
      cursor: pointer;
      color: gray;
      transition: color 0.35s ease;

      &:hover {
        color: $app-primary-color;
      }
    }

    .map-iframe-container {
      height: 80%;
      width: 80%;
      background: #fff;
      border: 1px solid black;
      overflow: hidden;
    }

    .my-iframe {
      height:100%;
      width:100%;
      position:relative;
      border-width:0px;
    }
  }
</style>
