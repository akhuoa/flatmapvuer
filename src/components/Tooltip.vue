<template>
  <div class="tooltip-container" id="tooltip-container">
    <template v-if="annotationDisplay">
      <annotation-tool :annotationEntry="annotationEntry" />
    </template>
    <template v-else>
      <provenance-popup :entry="entry" @view-image="viewImage"/>
    </template>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import AnnotationTool from './AnnotationTool.vue'
import ProvenancePopup from './ProvenancePopup.vue'

export default {
  name: 'Tooltip',
  components: {
    AnnotationTool,
    ProvenancePopup,
  },
  props: {
    entry: {
      type: Object,
    },
    annotationDisplay: {
      type: Boolean,
      default: false,
    },
    annotationEntry: {
      type: Object,
    }
  },
  methods: {
    viewImage: function (data) {
      this.$emit('view-image', data)
    }
  }
}
</script>

<style lang="scss" scoped>
.tooltip-container {
  text-align: justify;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  background: #fff;
  border: 1px solid $app-primary-color;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
