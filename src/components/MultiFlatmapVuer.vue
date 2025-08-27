<template>
  <div class="multi-container" ref="multiContainer">
    <div style="position: absolute; z-index: 100" v-if="!disableUI">
      <div class="species-display-text">Species</div>
      <el-popover
        content="Select a species"
        placement="right"
        trigger="manual"
        popper-class="flatmap-popper flatmap-teleport-popper right-popper"
        width="max-content"
        :visible="activateTooltipByIndex(0)"
        :teleported="false"
        ref="selectPopover"
      >
        <template #reference>
          <el-select
            id="flatmap-select"
            :teleported="false"
            v-model="activeSpecies"
            placeholder="Select"
            class="select-box"
            popper-class="flatmap-dropdown"
            @change="setSpecies"
          >
            <el-option
              v-for="(item, key) in speciesList"
              :key="key"
              :label="key"
              :value="key"
            >
              <span class="select-box-icon">
                <i :class="item.iconClass"></i>
              </span>
              {{ key }}
            </el-option>
          </el-select>
        </template>

      </el-popover>
    </div>
    <!--
      This event is emitted when the user chooses a different map option
      from ``openMapOptions`` props.
      @event open-map
      @arg {Object} `$event`
    -->
    <FlatmapVuer
      v-for="(item, key) in speciesList"
      :key="key"
      v-show="activeSpecies == key"
      :entry="item.taxo"
      :uuid="item.uuid"
      :biologicalSex="item.biologicalSex"
      :displayWarning="item.displayWarning"
      :displayLatestChanges="item.displayLatestChanges"
      :isLegacy="item.isLegacy"
      :ref="key"
      :enableOpenMapUI="enableOpenMapUI"
      :openMapOptions="openMapOptions"
      :disableUI="disableUI"
      @view-latest-map="viewLatestMap"
      @resource-selected="resourceSelected"
      @ready="FlatmapReady"
      @pan-zoom-callback="panZoomCallback"
      :annotationSidebar="annotationSidebar"
      @annotation-open="onAnnotationOpen"
      @annotation-close="onAnnotationClose"
      @update-offline-annotation-enabled="updateOfflineAnnotationEnabled"
      :connectivityInfoSidebar="connectivityInfoSidebar"
      @connectivity-info-open="onConnectivityInfoOpen"
      @connectivity-info-close="onConnectivityInfoClose"
      @connectivity-error="onConnectivityError"
      @neuron-connection-feature-click="onNeuronConnectionFeatureClick"
      @open-map="$emit('open-map', $event)"
      @pathway-selection-changed="onSelectionsDataChanged"
      :minZoom="minZoom"
      :helpMode="activeSpecies == key && helpMode"
      :helpModeActiveItem="helpModeActiveItem"
      :helpModeDialog="helpModeDialog"
      :helpModeInitialIndex="-2"
      @help-mode-last-item="onHelpModeLastItem"
      @shown-tooltip="onTooltipShown"
      @shown-map-tooltip="onMapTooltipShown"
      :renderAtMounted="renderAtMounted"
      :displayMinimap="displayMinimap"
      :showStarInLegend="showStarInLegend"
      style="height: 100%"
      :mapManager="mapManagerRef"
      :flatmapAPI="flatmapAPI"
      :sparcAPI="sparcAPI"
      :showLocalSettings="showLocalSettings"
      :showOpenMapButton="showOpenMapButton"
      :showPathwayFilter="showPathwayFilter"
      @trackEvent="trackEvent"
      :externalLegends="externalLegends"
    />
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { markRaw } from 'vue'
import EventBus from './EventBus'
import FlatmapVuer from './FlatmapVuer.vue'
import * as flatmap from 'https://cdn.jsdelivr.net/npm/@abi-software/flatmap-viewer@4.2.13/+esm'
import {
  ElCol as Col,
  ElOption as Option,
  ElSelect as Select,
  ElRow as Row,
  ElPopover as Popover,
} from 'element-plus'

const TAXON_UUID = {
  'NCBITaxon:10114': '01fedbf9-d783-509c-a10c-827941ab13da',
  'NCBITaxon:9823': 'a336ac04-24db-561f-a25f-1c994fe17410',
  'NCBITaxon:9606': '42ed6323-f645-5fbe-bada-9581819cf689',
  'NCBITaxon:10090': '25285fab-48a0-5620-a6a0-f9a0374837d5',
  'NCBITaxon:9685': '73060497-46a6-52bf-b975-cac511c127cb',
}

/**
 * A vue component to show a flatmap from the list of multiple flatmap data.
 */
export default {
  name: 'MultiFlatmapVuer',
  components: {
    Col,
    Row,
    Option,
    Select,
    Popover,
    FlatmapVuer,
  },
  created: function () {
    this.loadMapManager();
  },
  mounted: function () {
    this.initialise()
    EventBus.on('onActionClick', (action) => {
      this.resourceSelected(action)
    })
    EventBus.on('open-pubmed-url', (url) => {
      /**
       * This event is emitted when the user clicks
       * on "Open publications in pubmed" button
       * from provenance popup.
       * @arg url
       */
      this.$emit('open-pubmed-url', url);
    });
  },
  methods: {
    /**
     * @public
     * Function to initialise the component when mounted.
     * It returns a promise.
     */
    initialise: function () {
      return new Promise((resolve) => {
        if (this.requireInitialisation) {
          //It has not been initialised yet
          this.requireInitialisation = false
          fetch(this.flatmapAPI)
            .then((response) => response.json())
            .then((data) => {
              //Check each key in the provided availableSpecies against the one
              Object.keys(this.availableSpecies).forEach((key) => {
                // FIrst look through the uuid
                const uuid = this.availableSpecies[key].uuid
                if (uuid && data.map((e) => e.uuid).indexOf(uuid) > 0) {
                  this.speciesList[key] = this.availableSpecies[key]
                } else {
                  for (let i = 0; i < data.length; i++) {
                    if (this.availableSpecies[key].taxo === data[i].taxon) {
                      if (this.availableSpecies[key].biologicalSex) {
                        if (
                          data[i].biologicalSex &&
                          data[i].biologicalSex ===
                            this.availableSpecies[key].biologicalSex
                        ) {
                          this.speciesList[key] = this.availableSpecies[key]
                          break
                        }
                      } else {
                        this.speciesList[key] = this.availableSpecies[key]
                        break
                      }
                    }
                  }
                }
              })
              //Use the state species if it does not have any other species information
              let species = this.initial
              if (this.state) {
                const mapState = this.state.state
                if (
                  (!mapState || (!mapState.uuid && !mapState.entry)) &&
                  this.state.species
                )
                  species = this.state.species
                else species = undefined
              }
              if (species) {
                //No state resuming, set the current flatmap to {this.initial}
                if (species && this.speciesList[species] !== undefined) {
                  this.activeSpecies = species
                } else {
                  this.activeSpecies = Object.keys(this.speciesList)[0]
                }
                this.setSpecies(
                  this.activeSpecies,
                  this.state ? this.state.state : undefined,
                  5
                )
              }
              this.initialised = true
              resolve()
              //Resolve all other promises resolve in the list
              this.resolveList.forEach((other) => {
                other()
              })
            })
        } else if (this.initialised) {
          //resolve as it has been initialised
          resolve()
        } else {
          //resolve when the async initialisation is finished
          this.resolveList.push(resolve)
        }
      })
    },
    /**
     * Function to load `mapManager` to create flatmap.
     */
    loadMapManager: function () {
      if (!this.mapManagerRef) {
        if (this.mapManager) {
          this.mapManagerRef = this.mapManager;
        } else {
          this.mapManagerRef = markRaw(new flatmap.MapViewer(this.flatmapAPI, { container: undefined }));
          /**
           * The event emitted after a new mapManager is loaded.
           * This mapManager can be used to create new flatmaps.
           */
          this.$emit('mapmanager-loaded', this.mapManagerRef);
        }
      }
    },
    /**
     * @public
     * Function to emit ``resource-selected`` event with provided ``resource``.
     * @arg {Object} `action`
     */
     resourceSelected: function (action) {
      /**
       * This event is emitted by ``resourceSelected`` method.
       */
      this.$emit('resource-selected', action)
    },
    /**
     * @public
     * Function to emit ``ready`` event after the flatmap is loaded.
     * @arg {Object} `component`
     */
    FlatmapReady: function (component) {
      /**
       * This event is emitted by ``FlatmapReady`` method after the flatmap is loaded.
       * @arg component
       */
      this.$emit('ready', component)
    },
    /**
     * @public
     * Function to get the current active map.
     */
    getCurrentFlatmap: function () {
      return this.$refs[this.activeSpecies][0]
    },
    /**
     * @public
     * Function to emit ``pan-zoom-callback`` event
     * from the event emitted in ``callback`` function from ``MapManager.loadMap()``.
     * @arg {Object} `payload`
     */
    panZoomCallback: function (payload) {
      /**
       * The event emitted by ``panZoomCallback`` method.
       * @arg payload
       */
      this.$emit('pan-zoom-callback', payload)
    },
    onAnnotationClose: function () {
      this.$emit('annotation-close');
    },
    onAnnotationOpen: function (payload) {
      this.$emit('annotation-open', payload);
    },
    updateOfflineAnnotationEnabled: function (payload) {
      this.$emit('update-offline-annotation-enabled', payload);
    },
    onConnectivityInfoClose: function () {
      this.$emit('connectivity-info-close');
    },
    onConnectivityInfoOpen: function (entryData) {
      this.$emit('connectivity-info-open', entryData);
    },
    onConnectivityError: function (errorInfo) {
      this.$emit('connectivity-error', errorInfo);
    },
    onNeuronConnectionFeatureClick: function (payload) {
      this.$emit('neuron-connection-feature-click', payload);
    },
    onSelectionsDataChanged: function (data) {
      this.$emit('pathway-selection-changed', data);
    },
    /**
     * @public
     * Function to show popup on map.
     * @arg {String} `featureId`,
     * @arg {Object} `node`,
     * @arg {Object} `options`
     */
    showPopup: function (featureId, node, options) {
      let map = this.getCurrentFlatmap()
      map.showPopup(featureId, node, options)
    },
    /**
     * @public
     * Function to show marker popup.
     * @arg {String} `featureId`,
     * @arg {Object} `node`,
     * @arg {Object} `options`
     */
    showMarkerPopup: function (featureId, node, options) {
      let map = this.getCurrentFlatmap()
      map.showMarkerPopup(featureId, node, options)
    },
    /**
     * @public
     * Function to set species.
     * This function is called on the first load and
     * when user changes the species.
     * @arg {Array} `species`,
     * @arg {Object} `state`,
     * @arg {Number} `numberOfRetry`
     */
    setSpecies: function (species, state, numberOfRetry) {
      if (this.$refs && species in this.$refs) {
        this.activeSpecies = species
        this.$refs[this.activeSpecies][0].createFlatmap(state)
        /**
         * This event is emitted by ``setSpecies`` method.
         * Emitted on first load and when user changes species.
         * @arg activeSpecies
         */
        this.$emit('flatmapChanged', this.activeSpecies)
      } else if (numberOfRetry) {
        const retry = numberOfRetry - 1
        if (retry >= 0) {
          this.$nextTick(() => {
            this.setSpecies(species, state, retry)
          })
        }
      }
    },
    /**
     * Function to switch to the latest existing map from
     * a legacy map of the same species.
     * @arg state
     *
     * @private
     */
    viewLatestMap: function (state) {
      const keys = Object.keys(this.speciesList)
      for (let i = 0; i < keys.length; i++) {
        const species = this.speciesList[keys[i]]
        if (
          !species.isLegacy &&
          species.taxo === state.entry &&
          species.biologicalSex === state.biologicalSex
        ) {
          this.setSpecies(keys[i], state, 0)
          return
        }
      }
    },
    /**
     * Create a legacy entry with the provided information
     * @arg state,
     * @arg taxo,
     *
     * @private
     */
    createLegacyEntry: function (state, taxo, uuid) {
      if (uuid && taxo) {
        let name = 'Legacy'
        if (state.species) {
          if (state.species.slice(0, 6) === 'Legacy') name = state.species
          else name = name + ` ${state.species}`
        }
        this.speciesList[name] = {
          taxo: taxo,
          isLegacy: true,
          displayWarning: true,
        }
        return {
          species: name,
          state: {
            entry: taxo,
            uuid: uuid,
            viewport: state.state.viewport,
            searchTerm: state.state.searchTerm,
          },
        }
      }
    },
    /**
     * Function used to translate the legacy map state to one that can be used in current
     * flatmap if required. If it is a legacy, an Select entry will be added
     * @arg state
     *
     * @private
     */
    updateState: function (state) {
      return new Promise((resolve) => {
        if (state && state.state) {
          const mapState = state.state
          //uuid is not in the state, this is a legacy map
          if (!mapState.uuid) {
            if (mapState.entry) {
              const uuid =
                mapState.entry in TAXON_UUID
                  ? TAXON_UUID[mapState.entry]
                  : undefined
              const newState = this.createLegacyEntry(
                state,
                mapState.entry,
                uuid
              )
              resolve(newState ? newState : state)
            }
          } else if (mapState.entry) {
            //uuid is in the state but should be checked if it is the latest map
            //for that taxon
            return new Promise(() => {
              //mapManager.findMap_ is an async function so we need to wrap this with a promise
              const identifier = { taxon: mapState.entry }
              if (mapState.biologicalSex)
                identifier['biologicalSex'] = mapState.biologicalSex
              this.mapManagerRef
                .findMap(identifier)
                .then((map) => {
                  if (map.uuid !== mapState.uuid) {
                    return this.createLegacyEntry(
                      state,
                      mapState.entry,
                      mapState.uuid
                    )
                  }
                })
                .then((newState) => {
                  resolve(newState ? newState : state)
                })
                .catch(() => {
                  resolve(state)
                })
            })
          }
          //Create a new state and add the legacy map to the select
        }
        resolve(state)
      })
    },
    /**
     * @public
     * Function used for getting the current states of the scene. This exported states
     * can be imported using the importStates method.
     */
    getState: function () {
      let state = {
        species: this.activeSpecies,
        state: undefined,
      }
      let map = this.getCurrentFlatmap()
      state.state = map.getState()
      return state
    },
    /**
     * @public
     * Function used for importing the states of the scene. This exported states
     * can be imported using the read states method.
     * @arg {Object} state
     */
    setState: function (state) {
      if (state) {
        // Update undefined mapManagerRef for setState happens before created event
        this.loadMapManager();

        //Update state if required
        this.updateState(state).then((currentState) => {
          this.initialise().then(() => {
            if (
              currentState.species &&
              currentState.species !== this.activeSpecies
            ) {
              this.setSpecies(currentState.species, currentState.state, 5)
            } else if (currentState.state) {
              let map = this.getCurrentFlatmap()
              map.setState(currentState.state)
            }
          })
        })
      }
    },
    /**
     * @public
     * Function to activate help mode tooltip by item index number
     * @arg {Number} `index`
     */
    activateTooltipByIndex: function (index) {
      return (
        index === this.helpModeActiveItem
        && this.helpMode
      );
    },
    /**
     * @public
     * Function to check the last item of help mode
     * @arg {Boolean} `isLastItem`
     */
    onHelpModeLastItem: function (isLastItem) {
      if (isLastItem) {
        this.$emit('help-mode-last-item', true);
      }
    },
    /**
     * @public
     * Function to emit event after a tooltip is shown.
     */
    onTooltipShown: function () {
      /**
       * This event is emitted after a tooltip in Flatmap is shown.
       */
      this.$emit('shown-tooltip');
    },
    /**
     * @public
     * Function to emit event after a tooltip on the map is shown.
     */
    onMapTooltipShown: function () {
      /**
       * This event is emitted after a tooltip on Flatmap's map is shown.
       */
      this.$emit('shown-map-tooltip');
    },
    /**
     * @public
     * Function to change the view mode of the map.
     * @arg {String} `modeName`
     */
    changeViewingMode: function (modeName) {
      let map = this.getCurrentFlatmap()
      map.changeViewingMode(modeName)
    },
    setConnectionType: function (type) {
      let map = this.getCurrentFlatmap();
      map.setConnectionType(type);
    },
    /**
     * @public
     * Function to track events.
     * @arg {Object} `data`
     */
    trackEvent: function (data) {
      const taggingData = {
        'event': 'interaction_event',
        'location': 'flatmap',
        ...data,
      };
      this.$emit('trackEvent', taggingData);
    },
  },
  props: {
    /**
     * Initial species for the flatmap.
     * This value will be ignored if a valid state object is provided.
     */
    initial: {
      type: String,
      default: '',
    },
    /**
     * The minimum zoom level of the map.
     */
    minZoom: {
      type: Number,
      default: 1,
    },
    /**
     * The option to create map on component mounted.
     */
    renderAtMounted: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show tooltips for help mode.
     */
    helpMode: {
      type: Boolean,
      default: false,
    },
    /**
     * The active item index of help mode.
     */
    helpModeActiveItem: {
      type: Number,
      default: 0,
    },
    /**
     * The option to use helpModeDialog.
     * On default, `false`, clicking help will show all tooltips.
     * If `true`, clicking help will show the help-mode-dialog.
     */
    helpModeDialog: {
      type: Boolean,
      default: false,
    },
    /**
     * The last item of help mode.
     */
    helpModeLastItem: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to display minimap at the top-right corner of the map.
     */
    displayMinimap: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show star in legend area.
     */
    showStarInLegend: {
      type: Boolean,
      default: false,
    },
    /**
     * Flag to determine rather open map UI should be
     * presented or not.
     */
    enableOpenMapUI: {
      type: Boolean,
      default: false,
    },
    /**
     * The data to show different map options.
     * Available at the bottom-left corner ("Open new map" tooltip).
     */
    openMapOptions: {
      type: Array,
    },
    /**
     * The available species data for different maps.
     * This data is used for multi flatmaps.
     */
    availableSpecies: {
      type: Object,
      /**
       * ```{
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
            displayLatestChanges: true,
          },
          Mouse: {
            taxo: 'NCBITaxon:10090',
            iconClass: 'mapicon-icon_mouse',
            displayWarning: true,
          },
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
        }```
       */
      default: function () {
        return {
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
            displayLatestChanges: true,
          },
          Mouse: {
            taxo: 'NCBITaxon:10090',
            iconClass: 'mapicon-icon_mouse',
            displayWarning: true,
          },
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
        }
      },
    },
    /**
     * State containing state of the flatmap.
     */
    state: {
      type: Object,
      default: undefined,
    },
    /**
     * Flatmap's Map Manager to use as single Map Manager
     * when the value is provided.
     */
    mapManager: {
      type: Object,
      default: undefined,
    },
    /**
     * Specify the endpoint of the flatmap server.
     */
    flatmapAPI: {
      type: String,
      default: 'https://mapcore-demo.org/current/flatmap/v3/',
    },
    /**
     * Specify the endpoint of the SPARC API.
     */
    sparcAPI: {
      type: String,
      default: 'https://api.sparc.science/',
    },
    /**
     * Flag to disable UIs on Map
     */
    disableUI: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show connectivity information in sidebar
     */
    connectivityInfoSidebar: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show connectivity information in sidebar
     */
     annotationSidebar: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show local settings UI
     * (background colour, flight path, viewing mode, etc.)
     */
    showLocalSettings: {
      type: Boolean,
      default: true,
    },
    /**
     * The option to show open new map button
     */
    showOpenMapButton: {
      type: Boolean,
      default: true,
    },
    /**
     * The option to show pathway drawer
     */
    showPathwayFilter: {
      type: Boolean,
      default: true,
    },
    /**
     * Allow to add and display extra legends to drawer
     */
    externalLegends: {
      type: Array,
      default: [],
    },
  },
  data: function () {
    return {
      activeSpecies: undefined,
      speciesList: {},
      requireInitialisation: true,
      resolveList: markRaw([]),
      initialised: false,
      mapManagerRef: undefined,
    }
  },
  watch: {
    state: {
      handler: function (state) {
        this.setState(state)
      },
      immediate: true,
      deep: true,
    },
  },
}
</script>

<style lang="scss" scoped>
.multi-container {
  height: 100%;
  width: 100%;
}

.species-display-text {
  width: 47px;
  height: 20px;
  color: rgb(48, 49, 51);
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  left: 24px;
  top: 16px;
  position: absolute;
}

.select-box {
  background-color: var(--white);
  font-weight: 500;
  color: rgb(48, 49, 51);
  left: 16px;
  top: 44px;
  position: absolute;
  :deep(.el-input__inner) {
    color: rgb(48, 49, 51);
    padding-top: 0.25em;
  }
  :deep() {
    .el-select__wrapper {
      position: relative;
      width: fit-content;
      box-shadow: none;
      border-radius: 4px;
      border: 1px solid var(--el-border-color);
      &.is-focused {
        border-color: $app-primary-color;
      }
    }
    .el-select__selection {
      width: fit-content;
      position: relative;
    }
    .el-select__placeholder {
      position: relative;
      top: auto;
      transform: none;
      min-width: 80px;
      width: fit-content;
    }
    .el-input {
      .el-input__wrapper{
        &is-focus,
        &:focus {
          border: 1px solid $app-primary-color;
        }
      }
    }
  }

  .select-box-icon {
    display: inline-block;
    width: 24px;
    margin-right: 5px;
    text-align: center;
  }
}

.flatmap-dropdown {
  min-width: 160px !important;
  .el-select-dropdown__item {
    white-space: nowrap;
    text-align: left;
    &.selected {
      color: $app-primary-color;
      font-weight: normal;
    }
  }
}

.flatmap-popper {
  padding: 6px 4px;
  font-size: 12px;
  color: rgb(48, 49, 51);
  background-color: #f3ecf6;
  border: 1px solid $app-primary-color;
  white-space: nowrap;
  min-width: unset;
  &.right-popper {
    .popper__arrow {
      border-right-color: $app-primary-color !important;
      &:after {
        border-right-color: #f3ecf6 !important;
      }
    }
  }
}

:deep(.flatmap-marker-popup) {
  background-color: #f0f0f000 !important;
  box-shadow: none !important;
}
</style>

<style lang="scss">

.multi-container {
  --el-color-primary: #8300BF;
}

</style>
