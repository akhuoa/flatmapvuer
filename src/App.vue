<template>
  <div id="app">
    <el-popover
      placement="bottom"
      trigger="click"
      width="500"
      class="popover"
      :teleported="false"
    >
      <div class="options-container">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-button @click="helpMode = !helpMode" size="small"
              >Help Mode</el-button
            >
          </el-col>
          <el-col :span="8">
            <el-button @click="saveSettings()" size="small"
              >Save Settings</el-button
            >
          </el-col>
          <el-col :span="8">
            <el-button
              :disabled="mapSettings.length === 0"
              @click="restoreSettings()"
              size="small"
              >Restore Settings</el-button
            >
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <el-switch
              v-model="disableUI"
              active-text="Disable UI"
            >
            </el-switch>
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <el-autocomplete
              class="search-box"
              placeholder="Search"
              v-model="searchText"
              :fetch-suggestions="fetchSuggestions"
              @keyup.enter="search"
              @select="search"
              popper-class="autocomplete-popper"
              :teleported="false"
            >
            </el-autocomplete>
          </el-col>
        </el-row>
      </div>
      <template #reference>
        <el-button class="options-button" :icon="ElIconSetting"
          >Options</el-button>
      </template>
    </el-popover>

    <MultiFlatmapVuer
      ref="multi"
      :availableSpecies="availableSpecies"
      @resource-selected="FlatmapSelected"
      :minZoom="minZoom"
      @pan-zoom-callback="panZoomcallback"
      @open-map="openMap"
      @ready="FlatmapReady"
      :initial="initial"
      :helpMode="helpMode"
      :displayMinimap="true"
      :enableOpenMapUI="true"
      :flatmapAPI="flatmapAPI"
      :disableUI="disableUI"
      @open-pubmed-url="onOpenPubmedUrl"
      @pathway-selection-changed="onPathwaySelectionChanged"
    />
  </div>
</template>

<script>
import { shallowRef } from 'vue';
import { Setting as ElIconSetting } from '@element-plus/icons-vue'
/* eslint-disable no-alert, no-console */
import MultiFlatmapVuer from './components/MultiFlatmapVuer.vue'
import {
  ElAutocomplete as Autocomplete,
  ElButton as Button,
  ElCol as Col,
  ElPopover as Popover,
  ElRow as Row,
} from 'element-plus'
import './icons/mapicon-species-style.css'

export default {
  name: 'app',
  components: {
    Autocomplete,
    Button,
    Col,
    ElIconSetting,
    Popover,
    Row,
  },
  methods: {
    saveSettings: function () {
      this.mapSettings.push(this.$refs.multi.getState())
    },
    restoreSettings: function () {
      if (this.mapSettings.length > 0)
        this.$refs.multi.setState(this.mapSettings.pop())
    },
    FlatmapSelected: function (resource) {
      if (resource.eventType === 'click') {
        console.log('resource', resource)
      }
    },
    onOpenPubmedUrl: function (url) {
      console.log('open-pubmed-url', url);
    },
    onPathwaySelectionChanged: function (data) {
      console.log('pathway-selection-changed', data);
    },
    FlatmapReady: function (component) {
      console.log(component)
      let taxon = component.mapImp.describes
      let id = component.mapImp.addMarker('UBERON:0000948')
      window.flatmapImp = component.mapImp
      component.enablePanZoomEvents(true)
      //component.showPathwaysDrawer(false);
      console.log(taxon, id)
      //component.searchAndShowResult("heart");
    },
    panZoomcallback: function (payload) {
      this.payload = payload
    },
    openMap: function (map) {
      console.log(map)
    },
    fetchSuggestions: function (term, cb) {
      if (term === '') {
        cb([])
      } else {
        const suggestions = []
        const results = this.$refs.multi
          .getCurrentFlatmap()
          .searchSuggestions(term)
        results.__featureIds.forEach((id) => {
          const annotation = this.$refs.multi
            .getCurrentFlatmap()
            .mapImp.annotation(id)
          if (annotation && annotation.label) suggestions.push(annotation.label)
        })
        const unique = new Set(suggestions)
        suggestions.length = 0
        for (const item of unique) {
          suggestions.push({ value: '"' + item + '"' })
        }
        cb(suggestions)
      }
    },
    search: function () {
      console.log(this.searchText)
      this.$refs.multi
        .getCurrentFlatmap()
        .searchAndShowResult(this.searchText, true)
    },
  },
  data: function () {
    return {
      searchText: '',
      disableUI: false,
      minZoom: 4,
      availableSpecies: {
        'Human Female': {
          taxo: 'NCBITaxon:9606',
          biologicalSex: 'PATO:0000383',
          iconClass: 'mapicon-icon_human',
          displayWarning: true,
        },
        'Human Male': {
          taxo: 'NCBITaxon:9606',
          biologicalSex: 'PATO:0000384',
          iconClass: 'mapicon-icon_human',
          displayWarning: true,
        },
        Rat: {
          taxo: 'NCBITaxon:10114',
          iconClass: 'mapicon-icon_rat',
          displayWarning: true,
          displayLatestChanges: true,
        },
        'Rat (NPO)': {
          taxo: 'NCBITaxon:10116',
          iconClass: 'mapicon-icon_rat',
          displayWarning: true,
          displayLatestChanges: true,
        },
        Mouse: {
          taxo: 'NCBITaxon:10090',
          iconClass: 'mapicon-icon_mouse',
          displayWarning: true,
        },
        Kember: { taxo: 'ABI:1000001', displayWarning: true },
        Pig: {
          taxo: 'NCBITaxon:9823',
          iconClass: 'mapicon-icon_pig',
          displayWarning: true,
        },
        Cat: {
          taxo: 'NCBITaxon:9685',
          iconClass: 'mapicon-icon_cat',
          displayWarning: true,
        },
        Sample: { taxo: 'NCBITaxon:1', displayWarning: true },
        'Functional Connectivity': {
          taxo: 'FunctionalConnectivity',
          displayWarning: true,
        },
      },
      tooltipContent: undefined,
      tStyle: {
        top: '200px',
        left: '200px',
        position: 'absolute',
      },
      displayCloseButton: false,
      initial: 'Rat (NPO)',
      helpMode: false,
      mapSettings: [],
      //flatmapAPI: "https://mapcore-demo.org/current/flatmap/v2/"
      //flatmapAPI: "https://mapcore-demo.org/devel/flatmap/v3/"
      //flatmapAPI: "https://mapcore-demo.org/current/flatmap/v3/"
      flatmapAPI: 'https://mapcore-demo.org/devel/flatmap/v4/',
      //flatmapAPI: "https://mapcore-demo.org/fccb/flatmap/"
      //flatmapAPI: "https://mapcore-demo.org/staging/flatmap/v1/"
      // flatmapAPI: "https://mapcore-demo.org/devel/flatmap/v1/",
      ElIconSetting: shallowRef(ElIconSetting)
    }
  },
  components: {
    MultiFlatmapVuer,
  },
}
</script>

<style lang="scss">
#app {
  font-family: 'Asap', 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  width: 100%;
  position: absolute;
}

.maplibregl-ctrl-top-left .maplibregl-ctrl {
  margin-top: 120px;
}

.search-box {
  margin-top: 2px;
  height: 28px;
  :deep(.el-input__inner) {
    background-color: $background;
    height: 28px;
    line-height: 28px;
    border: 1px solid rgb(144, 147, 153);
    border-radius: 4px;
    &:focus {
      border-color: $app-primary-color;
    }
  }
}

:deep(.autocomplete-popper) {
  min-width: 137px !important;
  width: auto !important;
}

body {
  margin: 0px;
}

.maplibregl-ctrl-top-left .maplibregl-ctrl {
  margin-top: 120px;
}

.popover {
  top: 5px;
  right: calc(50% - 20px);
  position: absolute;
  z-index: 1000;
}

.el-row {
  margin-bottom: 5px;
  &:last-child {
    margin-bottom: 0;
  }
}

.options-button {
  z-index:100;
  position: absolute;
}

.options-container {
  text-align: center;
}

.el-tabs__content {
  height: 100%;
}
</style>
