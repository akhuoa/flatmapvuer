---
layout: home
---
<div class="demo-map-container full">
  <div class="demo-map-container-inner">
    <ClientOnly>
      <div>
        <el-button class="button">Help</el-button>
      </div>
      <MultiFlatmapVuer
        ref="multi"
        :availableSpecies="availableSpecies"
        @ready="FlatmapReady"
        :initial="initial"
        :helpMode="helpMode"
        :helpModeActiveItem="helpModeActiveItem"
        @help-mode-last-item="onHelpModeLastItem"
        @shown-tooltip="onTooltipShown"
        @shown-map-tooltip="onMapTooltipShown"
        :displayMinimap="true"
        :enableOpenMapUI="true"
        :flatmapAPI="flatmapAPI"
        :disableUI="disableUI"
        @flatmapChanged="onFlatmapChanged"
      />
      <HelpModeDialog
        v-if="helpMode"
        ref="multiflatmapHelp"
        :multiflatmapRef="multiflatmapRef"
        :lastItem="helpModeLastItem"
        @show-next="onHelpModeShowNext"
        @finish-help-mode="onFinishHelpMode"
      />
    </ClientOnly>
  </div>
</div>

<script setup>
import { getCurrentInstance } from 'vue'
import { createPinia } from 'pinia'
import { defineClientComponent } from 'vitepress'
import './demo-styles.css'

const app = getCurrentInstance()
const pinia = createPinia()
app.appContext.app.use(pinia)

const MultiFlatmapVuer = defineClientComponent(() => {
  return import('../src/components/MultiFlatmapVuer.vue')
})
const HelpModeDialog = defineClientComponent(() => {
  return import('../src/components/HelpModeDialog.vue')
})
</script>


<script>
export default {
  data: function() {
    return {
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
        Sample: { taxo: 'NCBITaxon:1', displayWarning: true },
        'Functional Connectivity': {
          taxo: 'FunctionalConnectivity',
          displayWarning: true,
        },
      },
      initial: 'Rat (NPO)',
      helpMode: false,
      flatmapAPI: 'https://mapcore-demo.org/devel/flatmap/v4/',
      disableUI: false,
    };
  }
}
</script>

<style>
  .demo-map-container.full {
    height: calc(100vh - 100px);
    padding-bottom: 0;
  }

  /* reset dropdown style to multiflatmapvuer's style */
  ul.el-scrollbar__view.el-select-dropdown__list {
    list-style: none;
    padding: 6px 0;
    margin: 0;
  }

  /* add missing font icons for dropdown | from css file - src/icons/mapicon-species-style.css */
  @font-face {
    font-family: 'mapicon-species';
    src:  url('../src/icons/fonts/mapicon-species.eot?h40clo');
    src:  url('../src/icons/fonts/mapicon-species.eot?h40clo#iefix') format('embedded-opentype'),
      url('../src/icons/fonts/mapicon-species.ttf?h40clo') format('truetype'),
      url('../src/icons/fonts/mapicon-species.woff?h40clo') format('woff'),
      url('../src/icons/fonts/mapicon-species.svg?h40clo#mapicon-species') format('svg');
    font-weight: normal;
    font-style: normal;
    font-display: block;
  }

  [class^="mapicon-icon"], [class*=" mapicon-icon"] {
    /* use !important to prevent issues with browser extensions that change fonts */
    font-family: 'mapicon-species' !important;
    speak: never;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;

    /* Better Font Rendering =========== */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .mapicon-icon_cat:before {
    content: "\e904";
  }
  .mapicon-icon_rat:before {
    content: "\e900";
  }
  .mapicon-icon_pig:before {
    content: "\e901";
  }
  .mapicon-icon_mouse:before {
    content: "\e902";
  }
  .mapicon-icon_human:before {
    content: "\e903";
  }
</style>
