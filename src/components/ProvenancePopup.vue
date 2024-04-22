<template>
  <div v-if="entry" class="main" v-loading="loading">
    <div class="block" v-if="entry.title">
      <div class="title">{{ capitalise(entry.title) }}</div>
      <div
        v-if="
          entry.provenanceTaxonomyLabel &&
          entry.provenanceTaxonomyLabel.length > 0
        "
        class="subtitle"
      >
        {{ provSpeciesDescription }}
      </div>
    </div>
    <div class="block" v-else>
      <div class="title">{{ entry.featureId }}</div>
    </div>
    <div class="block">
      <div>
        <el-button class="button" @click="viewImage({url: imageIframeURL})">
          <span>View images</span>
        </el-button>
        <div>
          <small>View images of this location within the MapVuer</small>
        </div>
      </div>
      <br>
      <div>
        <el-button class="button" @click="viewImage({items: galleryItems})">
          <span>Open images</span>
        </el-button>
        <div>
          <small>Open images of this location in the Dataset Gallery</small>
        </div>
      </div>
    </div>
    <div v-show="showDetails" class="hide" id="hide-path-info" @click="showDetails = false">
      Hide path information
      <el-icon><el-icon-arrow-up /></el-icon>
    </div>
    <div v-show="!showDetails" class="hide" id="show-path-info" @click="showDetails = true">
      Show path information
      <el-icon><el-icon-arrow-down /></el-icon>
    </div>
    <transition name="slide-fade">
      <div v-show="showDetails" class="content-container scrollbar">
        {{ entry.paths }}
        <div v-if="entry.origins && entry.origins.length > 0" class="block">
          <div>
            <span class="attribute-title">Origin</span>
            <el-popover
              width="250"
              trigger="hover"
              :teleported="false"
              popper-class="popover-origin-help"
            >
              <template #reference>
                <el-icon class="info"><el-icon-warning /></el-icon>
              </template>
              <span style="word-break: keep-all">
                <i>Origin</i> {{ originDescription }}
              </span>

            </el-popover>
          </div>
          <div
            v-for="(origin, i) in entry.origins"
            class="attribute-content"
            :origin-item-label="origin"
            :key="origin"
          >
            {{ capitalise(origin) }}
            <div v-if="i != entry.origins.length - 1" class="seperator"></div>
          </div>
          <el-button
            v-show="
              entry.originsWithDatasets && entry.originsWithDatasets.length > 0
            "
            class="button"
            id="open-dendrites-button"
            @click="openDendrites"
          >
            Explore origin data
          </el-button>
        </div>
        <div
          v-if="entry.components && entry.components.length > 0"
          class="block"
        >
          <div class="attribute-title">Components</div>
          <div
            v-for="(component, i) in entry.components"
            class="attribute-content"
            :component-item-label="component"
            :key="component"
          >
            {{ capitalise(component) }}
            <div
              v-if="i != entry.components.length - 1"
              class="seperator"
            ></div>
          </div>
        </div>
        <div
          v-if="entry.destinations && entry.destinations.length > 0"
          class="block"
        >
          <div>
            <span class="attribute-title">Destination</span>
            <el-popover
              width="250"
              trigger="hover"
              :teleported="false"
              popper-class="popover-origin-help"
            >
              <template #reference>
                <el-icon class="info"><el-icon-warning /></el-icon>
              </template>
              <span style="word-break: keep-all">
                <i>Destination</i> is where the axons terminate
              </span>
            </el-popover>
          </div>
          <div
            v-for="(destination, i) in entry.destinations"
            class="attribute-content"
            :destination-item-label="destination"
            :key="destination"
          >
            {{ capitalise(destination) }}
            <div
              v-if="i != entry.destinations.length - 1"
              class="seperator"
            ></div>
          </div>
          <el-button
            v-show="
              entry.destinationsWithDatasets &&
              entry.destinationsWithDatasets.length > 0
            "
            class="button"
            @click="openAxons"
          >
            Explore destination data
          </el-button>
        </div>

        <el-button
          v-show="
            entry.componentsWithDatasets &&
            entry.componentsWithDatasets.length > 0
          "
          class="button"
          @click="openAll"
        >
          Search for data on components
        </el-button>

        <external-resource-card :resources="resources"></external-resource-card>
      </div>
    </transition>
  </div>
</template>

<script>
import {
  ArrowUp as ElIconArrowUp,
  ArrowDown as ElIconArrowDown,
  Warning as ElIconWarning,
} from '@element-plus/icons-vue'
/* eslint-disable no-alert, no-console */
import {
  ElButton as Button,
  ElContainer as Container,
  ElIcon as Icon,
} from 'element-plus'

import EventBus from './EventBus'
import ExternalResourceCard from './ExternalResourceCard.vue'

const titleCase = (str) => {
  return str.replace(/\w\S*/g, (t) => {
    return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase()
  })
}

const capitalise = function (str) {
  if (str) return str.charAt(0).toUpperCase() + str.slice(1)
  return ''
}

// TODO: temp data for testing
const galleryItems = [
  {
    title: 'Title 1',
    type: 'data1',
    userData: 'https://sparc.science/',
  },
  {
    title: 'Title 2',
    type: 'data2',
    link: 'https://sparc.science/',
  },
  {
    title: 'Title 3',
    type: 'data3',
    link: 'https://sparc.science/',
  },
]
const imageIframeURL = 'https://sparc.biolucida.net/image?c=NzQ5My1jb2wtMTkz'

export default {
  name: 'ProvenancePopup',
  components: {
    Button,
    Container,
    Icon,
    ExternalResourceCard,
    ElIconArrowUp,
    ElIconArrowDown,
    ElIconWarning,
  },
  props: {
    entry: {
      type: Object,
      default: () => ({
        destinations: [],
        origins: [],
        components: [],
        destinationsWithDatasets: [],
        originsWithDatasets: [],
        componentsWithDatasets: [],
        resource: undefined,
      }),
    },
  },
  data: function () {
    return {
      controller: undefined,
      activeSpecies: undefined,
      pubmedSearchUrl: '',
      loading: false,
      showToolip: false,
      showDetails: false,
      showImages: false,
      galleryItems: galleryItems,
      imageIframeURL: imageIframeURL,
      originDescriptions: {
        motor: 'is the location of the initial cell body of the circuit',
        sensory: 'is the location of the initial cell body in the PNS circuit',
      },
      componentsWithDatasets: [],
      uberons: [{ id: undefined, name: undefined }],
    }
  },
  computed: {
    resources: function () {
      let resources = []
      if (this.entry && this.entry.hyperlinks) {
        resources = this.entry.hyperlinks
      }
      return resources
    },
    originDescription: function () {
      if (
        this.entry &&
        this.entry.title &&
        this.entry.title.toLowerCase().includes('motor')
      ) {
        return this.originDescriptions.motor
      } else {
        return this.originDescriptions.sensory
      }
    },
    provSpeciesDescription: function () {
      let text = 'Observed in'
      this.entry.provenanceTaxonomyLabel.forEach((label) => {
        text += ` ${label},`
      })
      text = text.slice(0, -1) // remove last comma
      text += ' species'
      return text
    },
  },
  methods: {
    titleCase: function (title) {
      return titleCase(title)
    },
    capitalise: function (text) {
      return capitalise(text)
    },
    openUrl: function (url) {
      window.open(url, '_blank')
    },
    openAll: function () {
      EventBus.emit('onActionClick', {
        type: 'Facets',
        labels: this.entry.componentsWithDatasets.map((a) => a.name),
      })
    },
    openAxons: function () {
      EventBus.emit('onActionClick', {
        type: 'Facets',
        labels: this.entry.destinationsWithDatasets.map((a) => a.name),
      })
    },
    openDendrites: function () {
      EventBus.emit('onActionClick', {
        type: 'Facets',
        labels: this.entry.originsWithDatasets.map((a) => a.name),
      })
    },
    pubmedSearchUrlUpdate: function (val) {
      this.pubmedSearchUrl = val
    },
    viewImage: function (data) {
      this.$emit('view-image', data)
    }
  },
}
</script>

<style lang="scss" scoped>

.display {
  width: 44px;
  word-break: normal;
}

.title {
  text-align: left;
  // width: 16em;
  line-height: 1.5em !important;
  font-size: 1em;
  font-family: Helvetica;
  font-weight: 500;
  /* font-weight: bold; */
  padding-bottom: 8px;
}

.block {
  margin-bottom: 0.5em;

  .main > &:first-of-type {
    margin-right: 0.5em;
  }
}

.pub {
  width: 16rem;
}

.icon {
  right: 0px;
  position: absolute;
  top: 10px;
}

.icon:hover {
  cursor: pointer;
}

.popover-origin-help {
  text-transform: none !important; // need to overide the tooltip text transform
}

.info {
  transform: rotate(180deg);
  color: #8300bf;
  margin-left: 8px;
}

.seperator {
  width: 90%;
  height: 1px;
  background-color: #bfbec2;
}

.hide {
  color: $app-primary-color;
  cursor: pointer;
  margin-right: 6px;
  margin-top: 3px;
}

.slide-fade-enter-active {
  transition: opacity 0.5s, transform 0.5s;
}
.slide-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.slide-fade-enter, .slide-fade-leave-to /* .slide-fade-leave-active in <2.1.8 */ {
  opacity: 0;
  transform: translateY(-8px);
}

.main {
  font-size: 14px;
  text-align: left;
  line-height: 1.5em;
  font-family: Asap, sans-serif, Helvetica;
  font-weight: 400;
  /* outline: thin red solid; */
  padding: 1em !important;
  overflow: hidden;
  min-width: 16rem;
}

.title {
  font-size: 18px;
  font-weight: 500;
  font-weight: bold;
  padding-bottom: 8px;
  color: rgb(131, 0, 191);
}

.attribute-title {
  font-size: 16px;
  font-weight: 600;
  /* font-weight: bold; */
  text-transform: uppercase;
}

.attribute-content {
  font-size: 14px;
  font-weight: 500;
}

.popover-container {
  height: 100%;
  width: 100%;
}

.main {
  .el-button.is-round {
    border-radius: 4px;
    padding: 9px 20px 10px 20px;
    display: flex;
    height: 36px;
  }
}

.button {
  margin-left: 0px !important;
  margin-top: 0px !important;
  font-size: 14px !important;
  background-color: $app-primary-color;
  color: #fff;
  & + .button {
    margin-top: 10px !important;
  }
  &:hover {
    color: #fff !important;
    background: #ac76c5 !important;
    border: 1px solid #ac76c5 !important;
  }
}

.tooltip-container {
  &::after,
  &::before {
    content: '';
    display: block;
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    flex-shrink: 0;
  }
  .tooltip {
    &::after {
      display: none;
    }
    &::before {
      display: none;
    }
  }
}

.maplibregl-popup-anchor-bottom {
  .tooltip-container {
    &::after,
    &::before {
      top: 100%;
      border-width: 12px;
    }
    &::after {
      margin-top: -1px;
      border-color: rgb(255, 255, 255) transparent transparent transparent;
    }
    &::before {
      margin: 0 auto;
      border-color: $app-primary-color transparent transparent transparent;
    }
  }
}

.maplibregl-popup-anchor-top {
  .tooltip-container {
    &::after,
    &::before {
      top: -24px;
      border-width: 12px;
    }
    &::after {
      margin-top: 1px;
      border-color: transparent transparent rgb(255, 255, 255) transparent;
    }
    &::before {
      margin: 0 auto;
      border-color: transparent transparent $app-primary-color transparent;
    }
  }
}

.content-container {
  overflow-y: scroll;
  scrollbar-width: thin !important;
  max-height: 240px;

  .block {
    padding-top: 0.5em;
  }
}

.scrollbar::-webkit-scrollbar-track {
  border-radius: 10px;
  background-color: #f5f5f5;
}

.scrollbar::-webkit-scrollbar {
  width: 12px;
  right: -12px;
  background-color: #f5f5f5;
}

.scrollbar::-webkit-scrollbar-thumb {
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  background-color: #979797;
}

/* Fix for chrome bug where under triangle pops up above one on top of it  */
.selector:not(*:root),
.tooltip-container::after {
  top: 99.4%;
}
</style>
