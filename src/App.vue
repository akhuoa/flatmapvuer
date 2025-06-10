<template>
  <div id="app">
    <el-popover
      placement="bottom"
      trigger="click"
      width="500"
      popper-class="popover options-popover"
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
      :helpModeDialog="useHelpModeDialog"
      :helpModeActiveItem="helpModeActiveItem"
      @help-mode-last-item="onHelpModeLastItem"
      @shown-tooltip="onTooltipShown"
      @shown-map-tooltip="onMapTooltipShown"
      :displayMinimap="true"
      :enableOpenMapUI="true"
      :flatmapAPI="flatmapAPI"
      :disableUI="disableUI"
      @open-pubmed-url="onOpenPubmedUrl"
      @pathway-selection-changed="onPathwaySelectionChanged"
      @flatmapChanged="onFlatmapChanged"
    />

    <HelpModeDialog
      v-if="helpMode && useHelpModeDialog"
      ref="multiflatmapHelp"
      :multiflatmapRef="multiflatmapRef"
      :lastItem="helpModeLastItem"
      @show-next="onHelpModeShowNext"
      @finish-help-mode="onFinishHelpMode"
    />
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { AnnotationService } from '@abi-software/sparc-annotation'
import { markRaw, shallowRef } from 'vue';
import { Setting as ElIconSetting } from '@element-plus/icons-vue'
import {
  ElAutocomplete as Autocomplete,
  ElButton as Button,
  ElCol as Col,
  ElPopover as Popover,
  ElRow as Row,
} from 'element-plus'
import './icons/mapicon-species-style.css'
import MultiFlatmapVuer from './components/MultiFlatmapVuer.vue'
import { HelpModeDialog } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'

export default {
  name: 'app',
  components: {
    Autocomplete,
    Button,
    Col,
    ElIconSetting,
    Popover,
    Row,
    MultiFlatmapVuer,
    HelpModeDialog,
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
        if (this.consoleOn) console.log('resource', resource)

        // Show marker on centreline of right vagus X nerve trunk
        const { kind, models, location } = resource.feature;
        if (window.flatmapImp && models && location && kind === 'centreline') {
          window.flatmapImp.clearMarkers();
          window.flatmapImp.addMarker(models, {
            location: location
          });
        }
      }
    },
    onOpenPubmedUrl: function (url) {
      if (this.consoleOn) console.log('open-pubmed-url', url);
    },
    onPathwaySelectionChanged: function (data) {
      if (this.consoleOn) console.log('pathway-selection-changed', data);
    },
    FlatmapReady: function (component) {
      if (this.consoleOn) console.log(component)
      let taxon = component.mapImp.describes
      let id = component.mapImp.addMarker('UBERON:0000948')
      window.flatmapImp = component.mapImp
      component.enablePanZoomEvents(true)
      //component.showPathwaysDrawer(false);
      if (this.consoleOn) console.log(taxon, id)
      //component.searchAndShowResult("heart");
      // component.changeViewingMode('Annotation')
    },
    panZoomcallback: function (payload) {
      this.payload = payload
    },
    openMap: function (map) {
      if (this.consoleOn) console.log(map)
    },
    fetchSuggestions: function (term, cb) {
      if (term === '') {
        cb([])
      } else {
        const suggestions = []
        const results = this.$refs.multi
          .getCurrentFlatmap()
          .searchSuggestions(term)
        const featureIds = results.__featureIds || results.featureIds;
        featureIds.forEach((id) => {
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
      if (this.consoleOn) console.log(this.searchText)
      this.$refs.multi
        .getCurrentFlatmap()
        .searchAndShowResult(this.searchText, true)
    },
    onFlatmapChanged: function (activeSpecies) {
      this.helpMode = false;
      // Update current flatmapImp after changing species
      if (this.$refs.multi.$refs[activeSpecies][0].mapImp) {
        window.flatmapImp = this.$refs.multi.$refs[activeSpecies][0].mapImp;
      }
    },
    onHelpModeShowNext: function () {
      this.helpModeActiveItem += 1;
    },
    onHelpModeLastItem: function (isLastItem) {
      if (isLastItem) {
        this.helpModeLastItem = true;
      }
    },
    onFinishHelpMode: function () {
      this.helpMode = false;
      // reset help mode to default values
      this.helpModeActiveItem = 0;
      this.helpModeLastItem = false;
    },
    onTooltipShown: function () {
      if (this.$refs.multi && this.$refs.multiflatmapHelp) {
        this.$refs.multiflatmapHelp.toggleTooltipHighlight();
      }
    },
    onMapTooltipShown: function () {
      if (this.$refs.multi && this.$refs.multiflatmapHelp) {
        this.$refs.multiflatmapHelp.toggleTooltipPinHighlight();
      }
    },
  },
  provide() {
    return {
      $annotator: this.annotator,
    }
  },
  data: function () {
    return {
      consoleOn: true,
      searchText: '',
      disableUI: false,
      minZoom: 1,
      availableSpecies: {
        'Human Female': {
          taxo: 'NCBITaxon:9606',
          biologicalSex: 'PATO:0000383',
          iconClass: 'mapicon-icon_human',
        },
        'Human Male': {
          taxo: 'NCBITaxon:9606',
          biologicalSex: 'PATO:0000384',
          iconClass: 'mapicon-icon_human',
          displayLatestChanges: true,
        },
        Rat: {
          taxo: 'NCBITaxon:10114',
          iconClass: 'mapicon-icon_rat',
          displayLatestChanges: true,
        },
        'Rat (NPO)': {
          taxo: 'NCBITaxon:10116',
          iconClass: 'mapicon-icon_rat',
          displayLatestChanges: true,
        },
        Mouse: {
          taxo: 'NCBITaxon:10090',
          iconClass: 'mapicon-icon_mouse',
        },
        Kember: { taxo: 'ABI:1000001', displayWarning: true },
        Pig: {
          taxo: 'NCBITaxon:9823',
          iconClass: 'mapicon-icon_pig',
        },
        Cat: {
          taxo: 'NCBITaxon:9685',
          iconClass: 'mapicon-icon_cat',
        },
        Vagus: {
          taxo: 'UBERON:0001759',
        },
        Sample: { taxo: 'NCBITaxon:1', displayWarning: true },
        'Functional Connectivity': {
          taxo: 'FunctionalConnectivity',
          displayWarning: true,
        },
        Test: {
          "taxo": "NCBITaxon:1",
          "displayWarning": true
        },
      },
      tooltipContent: undefined,
      tStyle: {
        top: '200px',
        left: '200px',
        position: 'absolute',
      },
      displayCloseButton: false,
      initial: 'Rat',
      helpMode: false,
      helpModeActiveItem: 0,
      helpModeLastItem: false,
      useHelpModeDialog: true,
      multiflatmapRef: null,
      mapSettings: [],
      //flatmapAPI: "https://mapcore-demo.org/current/flatmap/v2/"
      //flatmapAPI: "https://mapcore-demo.org/devel/flatmap/v3/"
      //flatmapAPI: "https://mapcore-demo.org/current/flatmap/v3/",
      flatmapAPI: 'https://mapcore-demo.org/devel/flatmap/v4/',
      //flatmapAPI: 'https://mapcore-demo.org/curation/flatmap/',
      //flatmapAPI: "https://mapcore-demo.org/fccb/flatmap/"
      //flatmapAPI: "https://mapcore-demo.org/staging/flatmap/v1/"
      // flatmapAPI: "https://mapcore-demo.org/devel/flatmap/v1/",
      ElIconSetting: shallowRef(ElIconSetting),
      annotator: markRaw(new AnnotationService(`https://mapcore-demo.org/devel/flatmap/v4/annotator`)),
    }
  },
  mounted: function () {
    this.multiflatmapRef = this.$refs.multi;
  },
  watch: {
    helpMode: function (newVal) {
      if (!newVal) {
        this.helpModeActiveItem = 0;
      }
    }
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
  left: 50%;
  transform: translateX(-50%);
}

.options-container {
  text-align: center;
}

.el-tabs__content {
  height: 100%;
}
</style>
