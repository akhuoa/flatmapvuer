<template>
  <div
    class="flatmap-container"
    ref="flatmapContainer"
    v-loading="loading"
    element-loading-text="Loading..."
    element-loading-background="rgba(0, 0, 0, 0.3)"
  >
    <map-svg-sprite-color />
    <div
      style="height: 100%; width: 100%; position: relative; overflow-y: none"
    >
      <div style="height: 100%; width: 100%" ref="display"></div>
      <div class="beta-popovers" v-show="!disableUI">
        <div>
          <el-popover
            placement="right"
            popper-class="warning-popper flatmap-popper"
            :teleported="false"
            :visible="hoverVisibilities[7].value"
            ref="warningPopover"
          >
<!--
What magic meaning do the numbers 6, 7, etc have?

Please use `const` to assign meaningful names to them...
 -->
            <p
              v-if="isLegacy"
              @mouseover="showTooltip(7)"
              @mouseout="hideTooltip(7)"
            >
              This is a legacy map, you may view the latest map instead.
            </p>
            <p
              v-else-if="isFC"
              @mouseover="showTooltip(7)"
              @mouseout="hideTooltip(7)"
            >
              This map displays the connectivity of individual neurons.
              Specifically, those which align with (parts of) the neuron
              populations from the
              <a
                href="https://sparc.science/resources/1ZUKXU2YmLcn2reCyXjlew"
                target="_blank"
              >
                ApiNATOMY
              </a>
              models available in
              <a
                href="https://sparc.science/resources/6eg3VpJbwQR4B84CjrvmyD"
                target="_blank"
              >
                SCKAN </a
              >.
            </p>
            <p v-else @mouseover="showTooltip(7)" @mouseout="hideTooltip(7)">
              This map displays the connectivity of neuron populations.
              Specifically, those from the primarily rat-based
              <a
                href="https://sparc.science/resources/1ZUKXU2YmLcn2reCyXjlew"
                target="_blank"
              >
                ApiNATOMY
              </a>
              models available in
              <a
                href="https://sparc.science/resources/6eg3VpJbwQR4B84CjrvmyD"
                target="_blank"
              >
                SCKAN </a
              >. New connectivity and species specificity will be added as the
              SPARC program progresses.
            </p>
            <template #reference>
              <div
                class="warning-icon"
                @mouseover="showTooltip(7)"
                @mouseout="hideTooltip(7)"
              >
                <el-icon v-if="displayWarning || isLegacy"><el-icon-warning-filled /></el-icon>
                <template v-if="isLegacy">
                  <span class="warning-text">Legacy Map</span>
                  <div class="latest-map-text" @click="viewLatestMap">
                    Click here for the latest map
                  </div>
                </template>
                <template v-else-if="displayWarning">
                  <span class="warning-text">Beta</span>
                </template>
              </div>
            </template>
          </el-popover>
        </div>
        <el-popover
          placement="right"
          v-if="displayLatestChanges"
          :teleported="false"
          trigger="manual"
          popper-class="warning-popper flatmap-popper"
          :visible="hoverVisibilities[8].value"
          ref="whatsNewPopover"
        >
          <template #reference>
            <div
              class="latest-changesicon"
              v-if="displayLatestChanges"
              @mouseover="showTooltip(8)"
              @mouseout="hideTooltip(8)"
            >
              <el-icon><el-icon-warning-filled /></el-icon>
              <span class="warning-text">What's new?</span>
            </div>
          </template>
          <template #default>
            <b>Connectivity References</b>
            <p>
              Connectivity references have been improved and available
              in various formats.
            </p>
            <b>Improved state storing</b>
            <p>
              Current selection and visibility filters are now stored
              when creating a permalink.
            </p>
          </template>
        </el-popover>
      </div>

      <!-- The element below is placed onto the flatmap when it is ready -->
      <el-icon
        class="minimap-resize"
        :class="{ enlarge: minimapSmall, shrink: !minimapSmall }"
        ref="minimapResize"
        v-show="minimapResizeShow"
        @click="closeMinimap"
      >
        <el-icon-arrow-down />
      </el-icon>

      <DrawToolbar
        v-if="viewingMode === 'Annotation' && (authorisedUser || offlineAnnotationEnabled) && !disableUI"
        :mapCanvas="{
          containerHTML: this.$el,
          class: '.maplibregl-canvas',
        }"
        :toolbarOptions="toolbarOptions"
        :activeDrawTool="activeDrawTool"
        :activeDrawMode="activeDrawMode"
        :newlyDrawnEntry="drawnCreatedEvent"
        :connectionEntry="connectionEntry"
        :hoverVisibilities="hoverVisibilities"
        @clickToolbar="toolbarEvent"
        @featureTooltip="connectedFeatureTooltip"
        @confirmDrawn="confirmDrawnFeature"
        @cancelDrawn="cancelDrawnFeature"
        @showTooltip="showTooltip"
        @hideTooltip="hideTooltip"
        ref="toolbarPopover"
      />

      <div class="bottom-right-control" v-show="!disableUI">
        <el-popover
          content="Zoom in"
          placement="left"
          :teleported="false"
          trigger="manual"
          width="70"
          popper-class="flatmap-popper"
          :visible="hoverVisibilities[1].value"
          ref="zoomInPopover"
        >
          <template #reference>
            <div
              class="icon-button-container"
              @click="zoomIn()"
              @mouseover="showTooltip(1)"
              @mouseout="hideTooltip(1)"
            >
              <map-svg-icon
                class="icon-button zoomIn"
                icon="zoomIn"
              />
            </div>
          </template>
        </el-popover>
        <el-popover
          content="Zoom out"
          placement="top-end"
          :teleported="false"
          trigger="manual"
          width="70"
          popper-class="flatmap-popper"
          :visible="hoverVisibilities[2].value"
          ref="zoomOutPopover"
        >
          <template #reference>
            <div
              class="icon-button-container"
              @click="zoomOut()"
              @mouseover="showTooltip(2)"
              @mouseout="hideTooltip(2)"
            >
              <map-svg-icon
                class="icon-button zoomOut"
                icon="zoomOut"
              />
            </div>
          </template>
        </el-popover>
        <el-popover
          content="Reset"
          placement="top"
          :teleported="false"
          trigger="manual"
          width="70"
          popper-class="flatmap-popper"
          :visible="hoverVisibilities[3].value"
          ref="zoomFitPopover"
        >
          <div>
            Fit to
            <br />
            window
          </div>
          <template #reference>
            <div
              class="icon-button-container"
              @click="resetView()"
              @mouseover="showTooltip(3)"
              @mouseout="hideTooltip(3)"
            >
              <map-svg-icon
                class="icon-button fitWindow"
                icon="fitWindow"
              />
            </div>
          </template>
        </el-popover>
      </div>
      <el-popover
        content="Change pathway visibility"
        placement="right"
        :teleported="false"
        trigger="manual"
        :offset="-18"
        popper-class="flatmap-popper"
        :visible="hoverVisibilities[6].value"
        ref="checkBoxPopover"
      >
        <template #reference>
          <div
            class="pathway-location"
            :class="{ open: drawerOpen, close: !drawerOpen }"
            v-show="!disableUI && requiresDrawer"
          >
            <div
              class="pathway-container"
              :class="{ open: drawerOpen, close: !drawerOpen }"
              :style="{ 'max-height': pathwaysMaxHeight + 'px' }"
              v-popover:checkBoxPopover
            >
              <svg-legends v-if="!isFC" class="svg-legends-container" />
              <template v-if="showStarInLegend">
                <el-popover
                  content="Location of the featured dataset"
                  placement="right"
                  :teleported="true"
                  trigger="manual"
                  width="max-content"
                  :offset="-10"
                  popper-class="flatmap-popper flatmap-teleport-popper"
                  :visible="hoverVisibilities[9].value"
                  ref="featuredMarkerPopover"
                >
                  <template #reference>
                    <div
                      v-popover:featuredMarkerPopover
                      class="yellow-star-legend"
                      v-html="yellowstar"
                      @mouseover="showTooltip(9)"
                      @mouseout="hideTooltip(9)"
                    ></div>
                  </template>
                </el-popover>
              </template>
              <!-- The line below places the yellowstar svg on the left, and the text "Featured markers on the right" with css so they are both centered in the div -->
              <el-popover
                content="Find these markers for data. The number inside the markers is the number of datasets available for each marker."
                placement="right"
                :teleported="false"
                width="200"
                trigger="manual"
                popper-class="flatmap-popper flatmap-marker-popper"
                :visible="hoverVisibilities[0].value"
                ref="markerPopover"
              >
                <template #reference>
                  <div
                    v-show="hoverVisibilities[0].value"
                    class="flatmap-marker-help"
                    v-html="flatmapMarker"
                    v-popover:markerPopover
                  ></div>
                </template>
              </el-popover>
              <tree-controls
                v-if="isFC && systems && systems.length > 0"
                class="treeControls"
                mapType="flatmap"
                title="Systems"
                :treeData="systems"
                :active="currentActive"
                :hover="currentHover"
                @checkChanged="systemSelected"
                @checkAll="checkAllSystems"
                @changeActive="ftuSelected"
                ref="treeControls"
              />
              <selections-group
                v-if="containsAlert && alertOptions && showPathwayFilter"
                title="Alert"
                labelKey="label"
                identifierKey="key"
                :selections="alertOptions"
                @changed="alertSelected"
                @checkboxMouseEnter="alertMouseEnterEmitted"
                @selections-data-changed="onSelectionsDataChanged"
                @checkAll="checkAllAlerts"
                ref="alertSelection"
                key="alertSelection"
              />
              <!--
                <selections-group
                  v-if="isFC && sckanDisplay && sckanDisplay.length > 0"
                  title="SCKAN"
                  labelKey="label"
                  identifierKey="key"
                  :selections="sckanDisplay"
                  @changed="sckanSelected"
                  @selections-data-changed="onSelectionsDataChanged"
                  @checkAll="checkAllSCKAN"
                  ref="skcanSelection"
                  key="skcanSelection"
                />
                <selections-group
                  v-if="layers && layers.length > 0"
                  title="Layers"
                  labelKey="description"
                  identifierKey="id"
                  :selections="layers"
                  @changed="layersSelected"
                  @selections-data-changed="onSelectionsDataChanged"
                  @checkAll="checkAllLayers"
                  ref="layersSelection"
                  key="layersSelection"
                />
              -->
              <selections-group
                v-if="pathways && pathways.length > 0"
                title="Pathways"
                labelKey="label"
                identifierKey="type"
                colourStyle="line"
                :selections="pathways"
                :showAsLegend="!showPathwayFilter"
                @changed="pathwaysSelected"
                @selections-data-changed="onSelectionsDataChanged"
                @checkAll="checkAllPathways"
                ref="pathwaysSelection"
                key="pathwaysSelection"
              />
              <selections-group
                v-if="taxonConnectivity && taxonConnectivity.length > 0 && showPathwayFilter"
                title="Studied in"
                labelKey="label"
                identifierKey="taxon"
                helpMessage="Evidence exists that this set of neuron populations have been studied in the given species."
                :selections="taxonConnectivity"
                @changed="taxonsSelected"
                @checkboxMouseEnter="taxonMouseEnterEmitted"
                @selections-data-changed="onSelectionsDataChanged"
                @checkAll="checkAllTaxons"
                ref="taxonSelection"
                key="taxonSelection"
              />
            </div>
            <div
              @click="toggleDrawer"
              class="drawer-button"
              :class="{ open: drawerOpen, close: !drawerOpen }"
            >
              <el-icon><el-icon-arrow-left /></el-icon>
            </div>
          </div>
        </template>
      </el-popover>
      <el-popover
        v-if="openMapRef"
        ref="open-map-popover"
        :virtual-ref="openMapRef"
        placement="top-start"
        width="136"
        :teleported="false"
        trigger="click"
        popper-class="open-map-popper non-selectable"
        virtual-triggering
      >
        <el-row v-for="item in openMapOptions" :key="item.key">
          <!--
            This event is emitted when the user chooses a different map option
            from ``openMapOptions`` props.
            @event open-map
            @arg {String} `mapOption.key`
          -->
          <el-button type="primary" plain
            @click="$emit('open-map', item.key)"
          >
            {{ item.display }}
          </el-button>
        </el-row>
      </el-popover>
      <el-popover
        ref="backgroundPopover"
        :virtual-ref="backgroundIconRef"
        placement="top-start"
        width="320"
        :teleported="false"
        trigger="click"
        popper-class="background-popper h-auto"
        virtual-triggering
      >
        <div>
          <el-row class="backgroundText">Viewing Mode</el-row>
          <el-row class="backgroundControl">
            <div style="margin-bottom: 2px;">
              <template
                  v-for="(value, key, index) in viewingModes"
                  :key="key"
                >
                  <template v-if="key === viewingMode">
                    <span class="viewing-mode-title"><b >{{ key }}</b></span>
                  </template>
                  <template v-else>
                    <span class="viewing-mode-unselected" @click="changeViewingMode(key)">{{ key }}</span>
                  </template>
              </template>
            </div>
            <el-row class="viewing-mode-description">
              {{ modeDescription }}
            </el-row>
            <el-row v-if="viewingMode === 'Annotation' && offlineAnnotationEnabled" class="viewing-mode-description">
              (Anonymous annotate)
            </el-row>
          </el-row>
          <template v-if="viewingMode === 'Annotation' && authorisedUser">
            <el-row class="backgroundText">Annotations From</el-row>
            <el-row class="backgroundControl">
              <el-select
                :teleported="false"
                v-model="annotationFrom"
                placeholder="Select"
                class="select-box"
                popper-class="flatmap_dropdown"
                @change="setAnnotationFrom"
              >
                <el-option
                  v-for="item in annotatedSource"
                  :key="item"
                  :label="item"
                  :value="item"
                >
                  <el-row>
                    <el-col :span="12">{{ item }}</el-col>
                  </el-row>
                </el-option>
              </el-select>
            </el-row>
          </template>
          <el-row class="backgroundSpacer" v-if="displayFlightPathOption"></el-row>
          <el-row class="backgroundText" v-if="displayFlightPathOption">Flight path display</el-row>
          <el-row class="backgroundControl" v-if="displayFlightPathOption">
            <el-radio-group
              v-model="flightPath3DRadio"
              class="flatmap-radio"
              @change="setFlightPath3D"
            >
            <el-radio :value="false">2D</el-radio>
            <el-radio :value="true">3D</el-radio>
            </el-radio-group>
          </el-row>
          <el-row class="backgroundSpacer"></el-row>
          <el-row class="backgroundText">Organs display</el-row>
          <el-row class="backgroundControl">
            <el-radio-group
              v-model="colourRadio"
              class="flatmap-radio"
              @change="setColour"
            >
              <el-radio :value="true">Colour</el-radio>
              <el-radio :value="false">Greyscale</el-radio>
            </el-radio-group>
          </el-row>
          <el-row class="backgroundSpacer"></el-row>
          <el-row class="backgroundText">Outlines display</el-row>
          <el-row class="backgroundControl">
            <el-radio-group
              v-model="outlinesRadio"
              class="flatmap-radio"
              @change="setOutlines"
            >
              <el-radio :value="true">Show</el-radio>
              <el-radio :value="false">Hide</el-radio>
            </el-radio-group>
          </el-row>
          <el-row class="backgroundSpacer"></el-row>
          <el-row class="backgroundText">Change background</el-row>
          <el-row class="backgroundControl">
            <div
              v-for="item in availableBackground"
              :key="item"
              :class="[
                'backgroundChoice',
                item,
                item == currentBackground ? 'active' : '',
              ]"
              @click="backgroundChangeCallback(item)"
            />
          </el-row>
        </div>
      </el-popover>
      <div
        class="settings-group"
        :class="{ open: drawerOpen, close: !drawerOpen }"
        v-show="!disableUI"
      >
        <el-row v-if="showOpenMapButton">
          <el-popover
            :visible="hoverVisibilities[4].value"
            content="Open new map"
            placement="right"
            :teleported="false"
            popper-class="flatmap-popper"
            ref="openMapPopover"
          >
            <template #reference>
              <div
                v-if="enableOpenMapUI && openMapOptions.length > 0"
                ref="openMapRef"
                class="icon-button-container"
                @mouseover="showTooltip(4)"
                @mouseout="hideTooltip(4)"
              >
                <map-svg-icon
                  icon="openMap"
                  class="icon-button open-map-button"
                />
              </div>
            </template>
          </el-popover>
        </el-row>
        <el-row v-if="showLocalSettings">
          <el-popover
            content="Change settings"
            placement="right"
            :visible="hoverVisibilities[5].value"
            :teleported="false"
            trigger="manual"
            popper-class="flatmap-popper"
            ref="settingsPopover"
          >
            <template #reference>
              <div
                ref="backgroundIconRef"
                class="icon-button-container"
                @mouseover="showTooltip(5)"
                @mouseout="hideTooltip(5)"
              >
                <map-svg-icon
                  icon="changeBckgd"
                  class="icon-button"
                />
              </div>
            </template>
          </el-popover>
        </el-row>
      </div>
      <Tooltip
        ref="tooltip"
        class="tooltip"
        v-if="tooltipDisplay"
        :annotationEntry="annotationEntry"
        :tooltipEntry="tooltipEntry"
        :annotationDisplay="viewingMode === 'Annotation'"
        @annotation="commitAnnotationEvent"
        @onActionClick="onActionClick"
      />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { inject, provide, shallowRef, markRaw } from 'vue'
import {
  WarningFilled as ElIconWarningFilled,
  ArrowDown as ElIconArrowDown,
  ArrowLeft as ElIconArrowLeft,
} from '@element-plus/icons-vue'
import SelectionsGroup from './SelectionsGroup.vue'
import { MapSvgIcon, MapSvgSpriteColor } from '@abi-software/svg-sprite'
import '@abi-software/svg-sprite/dist/style.css'
import SvgLegends from './legends/SvgLegends.vue'
import {
  ElButton as Button,
  ElCol as Col,
  ElLoading as Loading,
  ElRadio as Radio,
  ElRadioGroup as RadioGroup,
  ElRow as Row,
  ElSelect as Select,
  ElDialog as Dialog,
  ElIcon as Icon,
} from 'element-plus'
import flatmapMarker from '../icons/flatmap-marker'
import {
  FlatmapQueries,
  findTaxonomyLabels,
} from '../services/flatmapQueries.js'
import {
  getReferenceConnectivitiesFromStorage,
  loadAndStoreKnowledge,
  refreshFlatmapKnowledgeCache,
  getKnowledgeSource,
  getReferenceConnectivitiesByAPI,
  filterPathsByOriginFromKnowledge,
  filterPathsByDestinationFromKnowledge,
  filterPathsByViaFromKnowledge,
} from '../services/flatmapKnowledge.js'
import { capitalise } from './utilities.js'
import yellowstar from '../icons/yellowstar'
import ResizeSensor from 'css-element-queries/src/ResizeSensor'
import * as flatmap from 'https://cdn.jsdelivr.net/npm/@abi-software/flatmap-viewer@4.2.8/+esm'
import { AnnotationService } from '@abi-software/sparc-annotation'
import { mapState } from 'pinia'
import { useMainStore } from '@/store/index'
import {
  queryPathsByOrigin,
  queryPathsByViaLocation,
  queryPathsByDestination,
  extractOriginItems,
  extractDestinationItems,
  extractViaItems,
  queryAllConnectedPaths,
  DrawToolbar,
  Tooltip,
  TreeControls
} from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'
import EventBus from './EventBus.js'

const ERROR_MESSAGE = 'cannot be found on the map.';

const centroid = (geometry) => {
  let featureGeometry = { lng: 0, lat: 0, }
  let coordinates
  if (geometry.type === "Polygon") {
    if (geometry.coordinates.length) {
      coordinates = geometry.coordinates[0]
    }
  } else {
    coordinates = geometry.coordinates
  }
  if (coordinates) {
    if (!(geometry.type === 'Point')) {
      coordinates.map((coor) => {
        featureGeometry.lng += parseFloat(coor[0])
        featureGeometry.lat += parseFloat(coor[1])
      })
      featureGeometry.lng = featureGeometry.lng / coordinates.length
      featureGeometry.lat = featureGeometry.lat / coordinates.length
    } else {
      featureGeometry.lng += parseFloat(coordinates[0])
      featureGeometry.lat += parseFloat(coordinates[1])
    }
  }
  return featureGeometry
}

const processFTUs = (parent, key) => {
  const ftus = []
  let items = parent.organs ? parent.organs : parent.ftus
  const children = items
    ? items.filter(
        (obj, index) =>
          items.findIndex((item) => item.label === obj.label) === index
      )
    : undefined
  if (children) {
    children.forEach((child) => {
      const data = {
        label: child.label,
        models: child.models,
        key: `${key}.${child.label}`,
      }
      const grandChildren = processFTUs(child, data.key)
      if (grandChildren.length > 0) {
        data.children = grandChildren
      }
      ftus.push(data)
    })
  }
  return ftus
}

/**
 * A vue component of the flatmap viewer.
 */
export default {
  name: 'FlatmapVuer',
  components: {
    Button,
    Col,
    Loading,
    Radio,
    Icon,
    RadioGroup,
    Row,
    Select,
    Dialog,
    MapSvgIcon,
    MapSvgSpriteColor,
    Tooltip,
    TreeControls,
    SelectionsGroup,
    SvgLegends,
    ElIconWarningFilled,
    ElIconArrowDown,
    ElIconArrowLeft,
    DrawToolbar
  },
  beforeCreate: function () {
    //The state watcher may triggered before
    //created causing issue, This flag will
    //resolve this issue.
    this.setStateRequired = false
  },
  setup(props) {
    let annotator = inject('$annotator')
    if (!annotator) {
      annotator = markRaw(new AnnotationService(`${props.flatmapAPI}annotator`));
      provide('$annotator', annotator)
    }
    return { annotator }
  },
  methods: {
    enableFeatureResetOnClick: function (enable) {
      if (this.mapImp) {
        this.mapImp.enableFeatureResetOnClick(enable)
      }
    },
    /**
     *
     * @param filter format should follow #makeStyleFilter (flatmap-viewer)
     */
    setVisibilityFilter: function (filter) {
      // More filter options -> this.mapImp.featureFilterRanges()
      if (this.mapImp) {
        if (filter) {
          this.mapImp.setVisibilityFilter(filter);
        } else {
          this.mapImp.clearVisibilityFilter();
        }
      }
    },
    /**
     * @public
     * Function to manually send aborted signal when annotation tooltip popup or sidebar tab closed.
     */
    manualAbortedOnClose: function () {
      if (this.annotationSidebar) this.$emit("annotation-close")
      this.closeTooltip()
      this.annotationEventCallback({}, { type: 'aborted' })
      this.initialiseDrawing()
    },
    /**
     * @public
     * Function to initialise drawing.
     */
    initialiseDrawing: function () {
      this.connectionEntry = {}
      this.activeDrawTool = undefined
      this.activeDrawMode = undefined
      this.drawnCreatedEvent = {}
    },
    /**
     * @public
     * Function to cancel a newly drawn feature.
     */
    cancelDrawnFeature: function () {
      if (this.isValidDrawnCreated) {
        if (this.annotationSidebar) this.$emit("annotation-close")
        this.closeTooltip()
        this.annotationEntry = [{
          ...this.drawnCreatedEvent.feature,
          resourceId: this.serverURL,
        }]
        this.rollbackAnnotationEvent()
        this.initialiseDrawing()
      }
    },
    /**
     * @public
     * Function to display connected features' tooltip for drawn connectivity.
     * @param {String} `id`
     */
    connectedFeatureTooltip: function (value) {
      if (this.mapImp) {
        if (value) {
          const numericId = Number(value)
          const featureObject = numericId
            ? this.mapImp.featureProperties(numericId)
            : { feature: this.existDrawnFeatures.find(feature => feature.id === value.trim()) };
          let payload = { feature: featureObject }
          this.checkAndCreatePopups([payload])
        } else {
          this.closeTooltip()
        }
      }
    },
    /**
     * @public
     * Function to confirm a newly drawn feature.
     */
    confirmDrawnFeature: function () {
      if (this.isValidDrawnCreated) {
        this.checkAndCreatePopups([this.drawnCreatedEvent])
        // Add connection if exist to annotationEntry
        // Connection will only be added in creating new drawn feature annotation
        // And will not be updated if move drawn features
        if (Object.keys(this.connectionEntry).length > 0) {
          this.annotationEntry[0].feature.connection = this.connectionEntry
        }
        this.initialiseDrawing()
      }
    },
    /**
     * @public
     * Function to process the annotation toolbar click events.
     * @arg {String} `type`
     * @arg {String} `name`
     */
    toolbarEvent: function (type, name) {
      if (this.isValidDrawnCreated) return;
      this.manualAbortedOnClose()
      this.doubleClickedFeature = false
      // Deselect any feature when draw mode/tool is changed
      this.changeAnnotationDrawMode({ mode: 'simple_select' })
      if (type === 'mode') {
        this.activeDrawMode = name
      } else if (type === 'tool') {
        // Remove any unsubmitted drawn
        this.cancelDrawnFeature()
        if (name) {
          const tool = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
          this.changeAnnotationDrawMode({ mode: `draw${tool}` })
        }
        this.activeDrawTool = name
      }
    },
    /**
     * @public
     * Function to fire annotation event based on the provided ``data``.
     * Either edit or delete action.
     * @arg {Object} `data`
     */
    annotationDrawModeEvent: function (data) {
      if (this.activeDrawMode === 'Edit') {
        if (this.doubleClickedFeature) {
          if (data.feature.feature.geometry.type !== 'Point') {
            this.changeAnnotationDrawMode({
              mode: 'direct_select',
              options: { featureId: data.feature.feature.id }
            })
            this.modifyAnnotationFeature()
          }
          this.doubleClickedFeature = false
        }
      } else if (this.activeDrawMode === 'Delete') {
        this.changeAnnotationDrawMode({
          mode: 'simple_select',
          options: { featureIds: [data.feature.feature.id] }
        })
        this.modifyAnnotationFeature()
      }
    },
    /**
     * Function to create connectivity body from existing entries.
     */
    createConnectivityBody: function () {
      if (Object.keys(this.connectionEntry).length > 0) {
        const features = Object.values(this.connectionEntry)
        const body = {
          type: 'connectivity',
          source: features[0],
          target: features[features.length - 1],
          intermediates: features.filter((f, index) => index !== 0 && index !== features.length - 1),
        }
        this.annotationEntry[0].body = body
      }
    },
    /**
     * @public
     * Function to update the annotation draw mode.
     * @arg {Object} `mode`
     */
    changeAnnotationDrawMode: function (mode) {
      if (this.mapImp) {
        this.mapImp.changeAnnotationDrawMode(mode)
      }
    },
    /**
     * @public
     * Function to remove all drawn annotations from flatmap annotation layer.
     */
    clearAnnotationFeature: function () {
      if (this.mapImp) {
        this.mapImp.clearAnnotationFeature()
      }
    },
    /**
     * @public
     * Function to fire the ``trash`` action.
     * See https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#trash-draw for more details.
     */
    modifyAnnotationFeature: function () {
      if (this.mapImp) {
        // Fire the 'trash' button
        // Not only use to remove features
        // 'simple_select' for DELETE and 'direct_select' for EDIT
        this.mapImp.removeAnnotationFeature()
      }
    },
    /**
     * @public
     * Function to rollback the failure drawn from flatmap annotation layer.
     */
    rollbackAnnotationEvent: function () {
      // For 'updated' and 'deleted' callback
      if (
        this.mapImp &&
        this.annotationEntry.length > 0 &&
        ['created', 'updated', 'deleted'].includes(this.annotationEntry[0].type)
      ) {
        this.mapImp.rollbackAnnotationEvent(this.annotationEntry[0])
        this.annotationEntry = []
      }
    },
    /**
     * @public
     * Function to commit the emitted ``annotation`` data from successful new drawn to flatmap annotation layer.
     * @arg {Object} `annotation`
     */
    commitAnnotationEvent: function (annotation) {
      if (this.mapImp) {
        if (this.offlineAnnotationEnabled) {
          this.offlineAnnotations = JSON.parse(sessionStorage.getItem('anonymous-annotation')) || []
          this.offlineAnnotations.push(annotation)
          if (this.annotationEntry[0].type === 'deleted') {
            this.offlineAnnotations = this.offlineAnnotations.filter((offline) => {
              return offline.resource !== this.serverURL || offline.item.id !== annotation.item.id
            })
          }
          sessionStorage.setItem('anonymous-annotation', JSON.stringify(this.offlineAnnotations))
        }
        if (['created', 'updated', 'deleted'].includes(this.annotationEntry[0].type)) {
          this.featureAnnotationSubmitted = true
          this.mapImp.commitAnnotationEvent(this.annotationEntry[0])
          if (annotation.body.comment === "Position Updated") {
            this.annotationEntry[0].positionUpdated = false
          } else if (this.annotationEntry[0].type === 'deleted') {
            if (this.annotationSidebar) this.$emit("annotation-close")
            this.closeTooltip()
            // Only delete need, keep the annotation tooltip/sidebar open if created/updated
            this.annotationEntry = []
          }
          this.addAnnotationFeature()
        }
      }
    },
    /**
     * @public
     * Function to fetch annotated item id.
     * @arg {String} `userId`,
     * @arg {String} `participated`
     */
    fetchAnnotatedItemIds: async function (userId = undefined, participated = undefined) {
      let annotatedItemIds
      if (this.offlineAnnotationEnabled) {
        this.offlineAnnotations = JSON.parse(sessionStorage.getItem('anonymous-annotation')) || []
        annotatedItemIds = this.offlineAnnotations.filter((offline) => {
          return offline.resource === this.serverURL
        }).map(offline => offline.item.id)
      } else {
        annotatedItemIds = await this.annotator.annotatedItemIds(this.userToken, this.serverURL, userId, participated)
        // The annotator has `resource` and `items` fields
        if ('resource' in annotatedItemIds) annotatedItemIds = annotatedItemIds.itemIds
      }
      return annotatedItemIds
    },
    /**
     * @public
     * Function to add existing drawn annotations to flatmap.
     */
    setFeatureAnnotated: async function () {
      if (this.mapImp) {
        const annotatedItemIds = await this.fetchAnnotatedItemIds()
        for (const id of annotatedItemIds) {
          this.mapImp.setFeatureAnnotated(id)
        }
      }
    },
    /**
     * @public
     * Function to fetch drawn features.
     * @arg {String} `userId`,
     * @arg {String} `participated`
     */
    fetchDrawnFeatures: async function (userId, participated) {
      let drawnFeatures
      if (this.offlineAnnotationEnabled) {
        this.offlineAnnotations = JSON.parse(sessionStorage.getItem('anonymous-annotation')) || []
        drawnFeatures = this.offlineAnnotations.filter((offline) => {
          return offline.feature && offline.resource === this.serverURL
        }).map(offline => offline.feature)
      } else {
        const annotatedItemIds = await this.fetchAnnotatedItemIds(userId, participated)
        drawnFeatures = await this.annotator.drawnFeatures(this.userToken, this.serverURL, annotatedItemIds)
        // The annotator has `resource` and `features` fields
        if ('resource' in drawnFeatures) drawnFeatures = drawnFeatures.features
      }
      return drawnFeatures
    },
    /**
     * @public
     * Function to draw existing drawn annotations based on selector.
     */
    addAnnotationFeature: async function () {
      if (this.mapImp) {
        if (!this.featureAnnotationSubmitted) {
          this.clearAnnotationFeature()
          this.loading = true
        }
        const userId = this.annotationFrom === 'Anyone' ?
          undefined : this.authorisedUser.orcid ?
            this.authorisedUser.orcid : '0000-0000-0000-0000'
        const participated = this.annotationFrom === 'Anyone' ?
          undefined : this.annotationFrom === 'Me' ?
            true : false
        const drawnFeatures = await this.fetchDrawnFeatures(userId, participated)
        this.existDrawnFeatures = drawnFeatures
        this.loading = false
        if (!this.featureAnnotationSubmitted) {
          for (const feature of drawnFeatures) {
            this.mapImp.addAnnotationFeature(feature)
          }
        }
      }
    },
    /**
     * @public
     * Function to display annotator toolbar.
     * @arg {Boolean} `flag`
     */
    showAnnotator: function (flag) {
      if (this.mapImp) {
        // Control the show/hide of the drawn annotations
        this.mapImp.showAnnotator(flag)
        // Hide default toolbar, we will use customised SVG icons instead
        this.$el.querySelector('.maplibregl-ctrl-group').style.display = 'none'
      }
    },
    /**
     * @public
     * Function to switch the type of person who annotated.
     * @arg {Boolean} `flag`
     */
    setAnnotationFrom: function (flag) {
      this.annotationFrom = flag
      if (this.mapImp) {
        this.manualAbortedOnClose()
        this.addAnnotationFeature()
      }
    },
    /**
     * Function to emit offline annotation enabled status
     */
    emitOfflineAnnotationUpdate: function () {
      this.$emit('update-offline-annotation-enabled', this.offlineAnnotationEnabled);
    },
    /**
     * @public
     * Function to switch from 2D to 3D
     * @arg {Boolean} `flag`
     */
    setFlightPath3D: function (flag) {
      this.flightPath3DRadio = flag
      if (this.mapImp) {
        this.mapImp.enableFlightPaths(flag)
      }
    },
    /**
     * @public
     * Function to view the latest map (example when you are on legacy map).
     */
    viewLatestMap: function () {
      let biologicalSex = this.biologicalSex ? this.biologicalSex : undefined
      //Human requires special handling
      if (this.entry === 'NCBITaxon:9606') {
        biologicalSex = 'PATO:0000384'
      }
      const state = {
        entry: this.entry,
        biologicalSex,
        viewport: this.mapImp.getState(),
      }
      /**
       * The event emitted by ``viewLatestMap`` method.
       */
      this.$emit('view-latest-map', state)
    },
    /**
     * @public
     * Function to change the background colour of the map
     * by providing the ``colour``.
     * @arg {String} `colour`
     */
    backgroundChangeCallback: function (colour) {
      this.currentBackground = colour
      if (this.mapImp) {
        this.mapImp.setBackgroundColour(this.currentBackground, 1)
      }
    },
    /**
     * @public
     * Function to process a list of a FC flatmap's systems.
     * @arg {Array} `systems`
     */
    processSystems: function (systems) {
      this.systems.length = 0
      if (systems && systems.length > 0) {
        const data = { label: 'All', key: 'All', children: [] }
        systems.forEach((system) => {
          const child = {
            colour: system.colour,
            enabled: system.enabled,
            label: system.id,
            key: system.id,
          }
          const children = processFTUs(system, child.key)
          if (children.length > 0) child.children = children
          data.children.push(child)
        })
        this.systems.push(data)
      }
    },
    /**
     * @public
     * Function to add taxon identifiers into the taxon connectivity array,
     * by retrieving their corresponding labels using the flatmap API.
     * @arg {String} `flatmapAPI`,
     * @arg {Array} `taxonIdentifiers`
     */
    processTaxon: function (taxonIdentifiers, state) {
      this.taxonConnectivity.length = 0
      findTaxonomyLabels(this.mapImp, taxonIdentifiers).then((entityLabels) => {
        if (entityLabels.length) {
          entityLabels.forEach((entityLabel) => {
            let enabled = true
            if (state) {
              enabled = state.checkAll ? true : state.checked.includes(entityLabel.taxon)
            }
            this.taxonConnectivity.push({...entityLabel, enabled});
            if (this.mapImp) {
              this.mapImp.enableConnectivityByTaxonIds(entityLabel.taxon, enabled)
            }
          });
        }
      });
    },
    /**
     * @public
     * Function to show or hide the display of the bottom-left drawer container.
     */
    toggleDrawer: function () {
      this.drawerOpen = !this.drawerOpen
    },
    /**
     * @public
     * Function to toggle colour/greyscale of organs.
     * The parameter ``flag`` is a boolean, ``true`` (colour) and ``false`` (greyscale).
     * @arg {Boolean} `flag`
     */
    setColour: function (flag) {
      this.colourRadio = flag
      if (this.mapImp) {
        this.mapImp.setPaint({ coloured: flag, outlined: this.outlinesRadio })
      }
    },
    /**
     * @public
     * Function to toggle outlines f organs.
     * The parameter ``flag`` is a boolean, ``true`` to show outlines, ``false`` to hide outlines.
     * @arg {Boolean} `flag`
     */
    setOutlines: function (flag) {
      this.outlinesRadio = flag
      if (this.mapImp) {
        this.mapImp.setPaint({ coloured: this.colourRadio, outlined: flag })
      }
    },
    setInitMapState: function () {
      if (this.mapImp) {
        const map = this.mapImp.map;
        const bounds = this.mapImp.options.bounds;
        const initBounds = [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]]
        ];

        map.setMaxBounds(null); // override default
        map.setRenderWorldCopies(false);

        this.initMapState = markRaw({
          initBounds,
        });
      }
    },
    /**
     * @public
     * Function to toggle paths to default.
     * Also called when the associated button is pressed.
     */
    resetView: function () {
      if (this.mapImp) {
        // fit to window
        const map = this.mapImp.map;
        const { initBounds } = this.initMapState;
        // reset rotation
        map.resetNorthPitch({
          animate: false,
        });
        if (initBounds) {
          // reset zoom and position
          map.fitBounds(initBounds, {
            animate: false
          });
        }
        if (this.$refs.skcanSelection) {
          this.$refs.skcanSelection.reset()
        }
        if (this.$refs.layersSelection) {
          this.$refs.layersSelection.reset()
        }
        if (this.$refs.systemsSelection) {
          this.$refs.pathwaysSelection.reset()
        }
        if (this.$refs.pathwaysSelection) {
          this.$refs.pathwaysSelection.reset()
        }
      }
    },
    /**
     * @public
     * Function to zoom in.
     * Also called when the associated button is pressed.
     */
    zoomIn: function () {
      if (this.mapImp) {
        this.mapImp.zoomIn()
      }
    },
    /**
     * @public
     * Function to zoom out.
     * Also called when the associated button is pressed.
     */
    zoomOut: function () {
      if (this.mapImp) {
        this.mapImp.zoomOut()
      }
    },
    onSelectionsDataChanged: function (data) {
      this.$emit('pathway-selection-changed', data);
    },
    /**
     * // Currently not in use
     * Function to show or hide paths valid in SCKAN
     * by providing ``{key, value}`` pair in ``payload``.
     * @arg payload
     */
    sckanSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableSckanPath(payload.key, payload.value)
      }
    },
    /**
     * // Currently not in use
     * Function to show or hide all paths valid in SCKAN.
     * @arg payload
     */
    checkAllSCKAN: function (payload) {
      if (this.mapImp) {
        payload.keys.forEach((key) =>
          this.mapImp.enableSckanPath(key, payload.value)
        )
      }
    },
    /**
     * Function to highlight paths and features
     * @param data
     */
    zoomToFeatures: function (data) {
      if (this.mapImp) {
        this.mapImp.zoomToFeatures(data)
      }
    },
    /**
     * @public
     * Function to highlight the connected paths
     * by providing path model identifier, ``pathId`` or ``anatomicalId``.
     * @arg {string} `pathId` or `anatomicalId`
     */
    retrieveConnectedPaths: async function (payload, options = {}) {
      if (this.mapImp) {
        let connectedPaths = [];
        let connectedTarget = options.target?.length ? options.target : [];
        // The line below is to get the path features from the geojson ids
        const nodeFeatureIds = [...this.mapImp.pathModelNodes(payload)];
        const pathsOfEntities = await this.mapImp.queryPathsForFeatures(payload);
        if (nodeFeatureIds.length) {
          if (!connectedTarget.length) {
            const connectedType = options.type?.length ? options.type : ["all"];
            const connectivity = await this.flatmapQueries.queryForConnectivityNew(this.mapImp, payload[0]);
            const originsFlat = connectivity?.ids?.dendrites.flat(Infinity);
            const componentsFlat = connectivity?.ids?.components.flat(Infinity);
            const destinationsFlat = connectivity?.ids?.axons.flat(Infinity);
            let connected = [];
            if (connectedType.includes("origins")) connected.push(...originsFlat);
            if (connectedType.includes("components")) connected.push(...componentsFlat);
            if (connectedType.includes("destinations")) connected.push(...destinationsFlat);
            if (connectedType.includes("all")) connected.push(...originsFlat, ...componentsFlat, ...destinationsFlat);
            connectedTarget = [...new Set(connected)];
          }
          // Loop through the node features and check if we have certain nodes
          nodeFeatureIds.forEach((featureId) => {
            // Get the paths from each node feature
            const pathsL2 = this.mapImp.nodePathModels(featureId);
            pathsL2.forEach((path) => {
              // nodes of the second level path
              const nodeFeatureIdsL2 = this.mapImp.pathModelNodes(path);
              const nodeModelsL2 = nodeFeatureIdsL2.map((featureIdL2) => {
                return this.mapImp.featureProperties(featureIdL2).models;
              });
              const intersection = connectedTarget.filter(element => nodeModelsL2.includes(element));
              if (intersection.length && !connectedPaths.includes(path)) connectedPaths.push(path);
            });
          });
        } else if (pathsOfEntities.length) {
          if (connectedTarget.length) {
            pathsOfEntities.forEach((path) => {
              const nodeFeatureIds = this.mapImp.pathModelNodes(path);
              const nodeModels = nodeFeatureIds.map((featureId) => {
                return this.mapImp.featureProperties(featureId).models;
              });
              const intersection = connectedTarget.filter(element => nodeModels.includes(element));
              if (intersection.length && !connectedPaths.includes(path)) connectedPaths.push(path);
            });
          } else {
            connectedPaths = pathsOfEntities;
          }
        }
        connectedPaths = [...new Set([...connectedPaths, ...payload])];
        return connectedPaths;
      }
    },
    resetMapFilter: function() {
      const alert = this.mapFilters.alert;
      let filter;
      const isPathways = { 'tile-layer': 'pathways' };
      const notPathways = { NOT: isPathways };

      if (alert.with && !alert.without) {
        // Show pathways with alert
        filter = {
          OR: [notPathways, { AND: [isPathways, { HAS: 'alert' }] }]
        };
      } else if (!alert.with && alert.without) {
        // Show pathways without alert
        filter = {
          OR: [notPathways, { AND: [isPathways, { NOT: { HAS: 'alert' } }] }]
        };
      } else if (!alert.with && !alert.without) {
        // Hide all pathways
        filter = notPathways;
      }
      this.setVisibilityFilter(filter)
    },
    /**
     * @public
     * Function to enable/disable mouse enter and leave event for
     * alert checkbox
     * @arg {Object} `payload`
     */
    alertMouseEnterEmitted: function (payload) {
      if (this.mapImp) {
        if (payload.value) {
          let filter;
          const isPathways = { 'tile-layer': 'pathways' };
          const notPathways = { NOT: isPathways };

          if (payload.key === "alert" || payload.key === "withoutAlert") {
            const hasAlert = payload.key === "alert" ?
              { HAS: 'alert' } :
              { NOT: { HAS: 'alert' } };

            filter = { OR: [notPathways, { AND: [isPathways, hasAlert] }] };
          }
          this.setVisibilityFilter(filter)
        } else {
          this.resetMapFilter()
        }
      }
    },
    /**
     * @public
     * Function to enable/disable (show/hide) pathways with/without alert
     * by providing ``kay, value`` ``payload`` object ``{alertKey, true/false}``.
     * @arg {Object} `payload`
     */
    alertSelected: function (payload) {
      if (this.mapImp) {
        if (payload.key === "alert") {
          if (payload.value) {
            this.mapFilters.alert.with = true
          } else {
            this.mapFilters.alert.with = false
          }
        } else if (payload.key === "withoutAlert") {
          if (payload.value) {
            this.mapFilters.alert.without = true
          } else {
            this.mapFilters.alert.without = false
          }
        }
        this.resetMapFilter()
      }
    },
    /**
     * @public
     * Function to enable/disable (show/hide) all alerts
     * option by providing ``flag`` (true/false).
     * @arg {Boolean} `flag`
     */
    checkAllAlerts: function (payload) {
      if (this.mapImp) {
        if (payload.value) {
          this.mapFilters.alert.without = true
          this.mapFilters.alert.with = true
        } else {
          this.mapFilters.alert.without = false
          this.mapFilters.alert.with = false
        }
        this.resetMapFilter()
      }
    },
    /**
     * @public
     * Function to enable/disable (show/hide) the system
     * by providing ``kay, value`` ``payload`` object ``{systemId, true/false}``.
     * @arg {Object} `payload`
     */
    systemSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableSystem(payload.key, payload.value)
      }
    },
    /**
     * @public
     * Function to enable/disable (show/hide) all systems
     * by providing ``flag`` (true/false).
     * @arg {Boolean} `flag`
     */
    checkAllSystems: function (flag) {
      if (this.mapImp) {
        this.systems[0].children.forEach((key) =>
          this.mapImp.enableSystem(key.label, flag)
        )
      }
    },
    /**
     * @public
     * Function to display features with annotation matching the provided term.
     * @arg {String} `models`
     */
    ftuSelected: function (models) {
      this.searchAndShowResult(models, true)
    },
    /**
     * @public
     * Function to show or hide the layer
     * by providing ``{layerId, true/false}`` in ``payload``.
     * @arg {Object} `payload`
     */
    layersSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableLayer(payload.key, payload.value)
      }
    },
    /**
     * @public
     * Function to show or hide all layers
     * by providing ``payload`` with ``payload.keys`` array and ``payload.value`` flag.
     * @arg {Object} `payload`
     */
    checkAllLayers: function (payload) {
      if (this.mapImp) {
        payload.keys.forEach((key) =>
          this.mapImp.enableLayer(key, payload.value)
        )
      }
    },
    /**
     * @public
     * Function to show or hide connectivity features studied in particular species
     * by providing ``{taxonId, true/false}`` in ``payload.key, payload.value``.
     * @arg {Object} `payload`
     */
    taxonsSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableConnectivityByTaxonIds(payload.key, payload.value)
      }
    },
    taxonMouseEnterEmitted: function (payload) {
      if (this.mapImp) {
        if (payload.value) {
          clearTimeout(this.taxonLeaveDelay)
          let gid = this.mapImp.taxonFeatureIds(payload.key)
          this.mapImp.enableConnectivityByTaxonIds(payload.key, payload.value) // make sure path is visible
          this.mapImp.zoomToGeoJSONFeatures(gid, {noZoomIn: true})
        } else {
          this.taxonLeaveDelay = setTimeout(() => {
            // reset visibility of paths
            this.mapImp.unselectGeoJSONFeatures()
            payload.selections.forEach((item) => {
              let show = payload.checked.includes(item.taxon)
              this.mapImp.enableConnectivityByTaxonIds(item.taxon, show)
            })
          }, 1000);
        }
      }
    },
    /**
     * @public
     * Function to show or hide connectivity features studied in particular species
     * by providing ``payload`` with ``payload.keys`` array and ``payload.value`` flag.
     * @arg {Object} `payload`
     */
    checkAllTaxons: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableConnectivityByTaxonIds(payload.keys, payload.value)
      }
    },
    /**
     * @public
     * Function to hide or show paths of a given type
     * by providing ``{pathType, true/false}`` in ``payload.key, payload.value``.
     * @arg {Object} `payload`
     */
    pathwaysSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enablePath(payload.key, payload.value)
      }
    },
    /**
     * @public
     * Function to hide or show paths of a given type
     * by providing ``payload`` with ``payload.keys`` array and ``payload.value`` flag.
     * @arg {Object} `payload`
     */
    checkAllPathways: function (payload) {
      if (this.mapImp) {
        payload.keys.forEach((key) =>
          this.mapImp.enablePath(key, payload.value)
        )
      }
    },
    /**
     * @public
     * Function to generate callbacks as a result of panning/zooming the map.
     * ``flag`` (boolean) - generate callbacks when ``true``, otherwise disable them.
     * @arg {Boolean} `flag`
     */
    enablePanZoomEvents: function (flag) {
      this.mapImp.enablePanZoomEvents(flag)
    },
    /**
     * @public
     * Function to process annotation callbacks, invoked when events occur with the map.
     * @arg {Object} `payload`,
     * @arg {Object} `data`
     */
    annotationEventCallback: function (payload, data) {
      // Popup closed will trigger aborted event this is used to control the tooltip
      if (data.type === 'aborted') {
        // Rollback drawing when no new annotation submitted
        if (!this.featureAnnotationSubmitted) this.rollbackAnnotationEvent()
        else this.featureAnnotationSubmitted = false
        this.annotationEntry = []
      } else if (data.type === 'modeChanged') {
        if (data.feature.mode === 'direct_select') this.doubleClickedFeature = true
        if (this.annotationSidebar && data.feature.mode === 'simple_select' && this.activeDrawMode === 'Deleted') {
          this.annotationEventCallback({}, { type: 'aborted' })
        }
      } else if (data.type === 'selectionChanged') {
        this.selectedDrawnFeature = data.feature.features.length === 0 ?
          undefined : data.feature.features[0]
        payload.feature.feature = this.selectedDrawnFeature
        if (!this.activeDrawTool) { // Make sure dialog content doesn't change
          this.connectionEntry = {}
          // For exist drawn annotation features
          if (this.selectedDrawnFeature) {
            const drawnFeature = this.existDrawnFeatures.find(
              (feature) => feature.id === this.selectedDrawnFeature.id
            )
            if (drawnFeature && drawnFeature.connection) {
              this.connectionEntry = drawnFeature.connection
            }
            this.annotationDrawModeEvent(payload)
          } else {
            if (this.annotationSidebar && this.previousEditEvent.type === 'updated') {
              this.annotationEntry = [{
                ...this.previousEditEvent,
                resourceId: this.serverURL
              }]
              this.annotationEventCallback({}, { type: 'aborted' })
            }
            this.previousEditEvent = {}
          }
        }
      } else {
        if (data.type === 'created' || data.type === 'updated') {
          if (data.type === 'updated' && data.feature.action) {
            data.positionUpdated = data.feature.action === 'move'
          }
          const feature = this.mapImp.refreshAnnotationFeatureGeometry(data.feature)
          payload.feature.feature = feature
          // NB. this might now be `null` if user has deleted it (before OK/Submit)
          // so maybe then no `service.addAnnotation` ??
        }
        // Once double click mouse to confirm drawing, 'aborted' event will be triggered.
        // Hence disable direct popup when 'created' event, dialog will be used instead.
        if (data.type === 'created') this.drawnCreatedEvent = payload
        else this.checkAndCreatePopups([payload])
      }
      if (data.type === 'updated') this.previousEditEvent = data
      if (data.type === 'deleted') this.previousDeletedEvent = data
      else this.previousDeletedEvent = {}
    },
    /**
     * @public
     * A callback function, invoked when events occur with the map.
     * The first parameter gives the type of event, the second provides details about the event.
     * _(This is the ``callback`` function from ``MapManager.loadMap()``)_.
     */
    eventCallback: function () {
      return (eventType, data, ...args) => {
        if (eventType === 'annotation') {
          const payload = {
            feature: data,
            userData: args,
            eventType: eventType,
          }
          this.annotationEventCallback(payload, data)
        } else {
          if (eventType !== 'pan-zoom') {
            const label = data.label
            const resource = [data.models]
            const taxonomy = this.entry
            const biologicalSex = this.biologicalSex
            const featuresAlert = data.alert
            let taxons = undefined
            if (data.taxons) {
              // check if data.taxons is string or array
              if (typeof data.taxons !== 'object') {
                taxons = JSON.parse(data.taxons)
              } else {
                taxons = data.taxons
              }
            }
            let payload = [{
              dataset: data.dataset,
              biologicalSex: biologicalSex,
              taxonomy: taxonomy,
              resource: resource,
              label: label,
              feature: data,
              userData: args,
              eventType: eventType,
              provenanceTaxonomy: taxons,
              alert: featuresAlert
            }]
            if (eventType === 'click') {
              const singleSelection = Object.keys(data).includes('id')
              if (!singleSelection) {
                payload = []
                const mapuuid = data.mapUUID
                const seenIds = new Set();
                for (let [key, value] of Object.entries(data)) {
                  if (key !== 'mapUUID') {
                    const id = value.id
                    const label = value.label
                    const resource = [value.models]
                    let taxons = undefined
                    if (value.taxons) {
                      // check if data.taxons is string or array
                      if (typeof value.taxons !== 'object') {
                        taxons = JSON.parse(value.taxons)
                      } else {
                        taxons = value.taxons
                      }
                    }
                    if (seenIds.has(id)) continue;
                    seenIds.add(id);
                    payload.push({
                      dataset: value.dataset,
                      biologicalSex: biologicalSex,
                      taxonomy: taxonomy,
                      resource: resource,
                      label: label,
                      feature: value,
                      userData: args,
                      eventType: eventType,
                      provenanceTaxonomy: taxons,
                      alert: value.alert,
                      mapUUID: mapuuid
                    })
                  }
                }
              }
              const clickedItem = singleSelection ? data : data[0]
              this.setConnectivityDataSource(this.viewingMode, clickedItem);
              if (this.viewingMode === 'Neuron Connection') {
                // do nothing here
                // the method to highlight paths is moved to checkAndCreatePopups function
              } else {
                this.currentActive = clickedItem.models ? clickedItem.models : '' // This is for FC map
                // This is for annotation mode - draw connectivity between features/paths
                if (this.activeDrawTool && !this.isValidDrawnCreated) {
                  // Check if flatmap features or existing drawn features
                  const validDrawnFeature = clickedItem.featureId || this.existDrawnFeatures.find(
                    (feature) => feature.id === clickedItem.id
                  )
                  // Only the linestring will have connection
                  if (this.activeDrawTool === 'LineString' && validDrawnFeature) {
                    const key = clickedItem.featureId ? clickedItem.featureId : clickedItem.id
                    const nodeLabel = clickedItem.label ? clickedItem.label : `Feature ${clickedItem.id}`
                    // Add space before key to make sure properties follows adding order
                    this.connectionEntry[` ${key}`] = Object.assign(
                      { label: nodeLabel },
                      Object.fromEntries(
                        Object.entries(clickedItem)
                          .filter(([key]) => ['featureId', 'models'].includes(key))
                          .map(([key, value]) => [(key === 'featureId') ? 'id' : key, value])))
                  }
                }
              }
            } else if (
              eventType === 'mouseenter' &&
              !(this.viewingMode === 'Neuron Connection')
            ) {
              this.currentHover = data.models ? data.models : ''
            }
            if (
              data &&
              data.type !== 'marker' &&
              eventType === 'click' &&
              // Disable popup when drawing
              !this.activeDrawTool
            ) {
              this.checkAndCreatePopups(payload)
            }
            this.$emit('resource-selected', payload)
          } else {
            this.$emit('pan-zoom-callback', data)
          }
        }
      }
    },
    /**
     * The data for connectivity data source is just a placeholder data
     * to check which part of the map is clicked, e.g., path or feture or empty area,
     * based on the viewing mode.
     * The "connectivity-info-close" event will be emitted based on this data
     * when there has a click event on map.
     * @param viewingMode
     * @param data
     */
    setConnectivityDataSource: function (viewingMode, data) {
      // for Exploration mode, only path click will be used as data source
      this.connectivityDataSource = data.source;
      // for other modes, it can be feature or path
      if (viewingMode === 'Neuron Connection' || viewingMode === 'Annotation') {
        this.connectivityDataSource = data.featureId;
      }
    },
    /**
     * @public
     * Function triggered by viewing mode change.
     * (e.g., from 'Exploration' to 'Annotation')
     * All tooltips and popups currently showing on map will be closed
     * @arg {String} `modeName`
     */
    changeViewingMode: function (modeName) {
      if (modeName) {
        this.viewingMode = modeName
      }
      this.manualAbortedOnClose()
    },
    /**
     * @public
     * Function to remove active tooltips on map.
     */
    removeActiveTooltips: function () {
      // Remove active tooltip/popup on map
      if (this.mapImp) {
        this.mapImp.removePopup();
      }

      // Fallback: remove any existing toolitp on DOM
      const tooltips = this.$el.querySelectorAll('.flatmap-tooltip-popup');
      tooltips.forEach((tooltip) => tooltip.remove());
    },
    /**
     * Function to create tooltip for the provided connectivity data.
     * @arg {Array} `connectivityData`
     */
    createTooltipForConnectivity: function (connectivityData, geojsonId) {
      // combine all labels to show together
      // content type must be DOM object to use HTML
      const labelsContainer = document.createElement('div');
      labelsContainer.classList.add('flatmap-feature-label');

      connectivityData.forEach((connectivity, i) => {
        const { label } = connectivity;
        labelsContainer.append(capitalise(label));

        if ((i + 1) < connectivityData.length) {
          const hr = document.createElement('hr');
          labelsContainer.appendChild(hr);
        }
      });

      this.mapImp.showPopup(
        geojsonId,
        labelsContainer,
        {
          className: 'custom-popup flatmap-tooltip-popup',
          positionAtLastClick: false,
          preserveSelection: true,
        }
      );
    },
    /**
     * Function to show connectivity tooltips on the map
     * and highlight the nerve.
     * @arg {Object} `payload`
     */
    showConnectivityTooltips: function (payload) {
      const { connectivityInfo, data } = payload;
      const featuresToHighlight = [];
      const geojsonHighlights = [];
      const connectivityData = [];
      const errorData = [];

      // to keep the highlighted path on map
      if (connectivityInfo && connectivityInfo.featureId) {
        featuresToHighlight.push(...connectivityInfo.featureId);
      }

      if (this.mapImp) {
        // search the features on the map first
        data.forEach((connectivity) => {
          const response = this.mapImp.search(connectivity.id);

          if (response?.results.length) {
            const featureId = response?.results[0].featureId;
            connectivityData.push({ featureId, ...connectivity });
          } else {
            errorData.push(connectivity);
          }
        });

        if (connectivityData.length) {
          let geojsonId = connectivityData[0].featureId;

          this.mapImp.annotations.forEach((annotation) => {
            const anatomicalNodes = annotation['anatomical-nodes'];

            if (anatomicalNodes) {
              const anatomicalNodesString = anatomicalNodes.join('');
              const foundItem = connectivityData.every((item) =>
                anatomicalNodesString.indexOf(item.id) !== -1
              );

              if (foundItem) {
                geojsonId = annotation.featureId;
                geojsonHighlights.push(geojsonId);
              }
            }
          });

          this.createTooltipForConnectivity(connectivityData, geojsonId);
        } else {
          // Close all tooltips on the current flatmap element
          this.removeActiveTooltips();
        }

        // Emit error message for connectivity
        this.emitConnectivityError(errorData);

        // highlight all available features
        const featureIdsToHighlight = this.mapImp.modelFeatureIdList(featuresToHighlight);
        const allFeaturesToHighlight = [
          ...featureIdsToHighlight,
          ...geojsonHighlights
        ];

        this.mapImp.selectGeoJSONFeatures(allFeaturesToHighlight);
      }
    },
    showConnectivitiesByReference: function (resource) {
      this.searchConnectivitiesByReference(resource).then((featureIds) => {
        this.mapImp.selectFeatures(featureIds);
      });
    },
    searchConnectivitiesByReference: async function (resource) {
      const flatmapKnowledge = sessionStorage.getItem('flatmap-knowledge');
      let featureIds = [];

      if (flatmapKnowledge) {
        featureIds = await getReferenceConnectivitiesFromStorage(resource);
      } else {
        featureIds = await getReferenceConnectivitiesByAPI(this.mapImp, resource, this.flatmapQueries);
      }
      return featureIds;
    },
    getFlatmapKnowledge: function () {
      let flatmapKnowledge = [];
      const flatmapKnowledgeRaw = sessionStorage.getItem('flatmap-knowledge');
      if (flatmapKnowledgeRaw) {
        flatmapKnowledge = JSON.parse(flatmapKnowledgeRaw);
      }
      return flatmapKnowledge;
    },
    emitConnectivityError: function (errorData) {
      this.$emit('connectivity-error', {
        data: {
          errorData: errorData,
          errorMessage: ERROR_MESSAGE,
        }
      });
    },
    checkConnectivityTooltipEntry: function(tooltipEntry) {
      if (tooltipEntry?.length) {
        return undefined !== (tooltipEntry.find(entry => entry?.destinations?.length || entry?.components?.length))
      }
      return false
    },
    changeConnectivitySource: async function (payload) {
      const { entry, connectivitySource } = payload;
      if (entry.mapId === this.mapImp.id) {
        await this.flatmapQueries.queryForConnectivityNew(this.mapImp, entry.featureId[0], connectivitySource);
        this.tooltipEntry = this.tooltipEntry.map((tooltip) => {
          if (tooltip.featureId[0] === entry.featureId[0]) {
            return this.flatmapQueries.updateTooltipData(tooltip);
          }
          return tooltip;
        })
        if (this.checkConnectivityTooltipEntry(this.tooltipEntry)) {
          this.$emit('connectivity-info-open', this.tooltipEntry);
        }
      }
    },
    /**
     * @public
     * Function to create/display tooltips from the provided ``data``.
     * _checkNeuronClicked shows a neuron path pop up if a path was recently clicked._
     * @arg {Object} `data`
     */
    checkAndCreatePopups: async function (data, connectivityExplorerClicked) {
      // Call flatmap database to get the connection data
      if (this.viewingMode === 'Annotation') {
        const features = data.filter(d => d.feature).map(d => d.feature)
        if (features.length > 0) {
          if (this.annotationSidebar && this.previousDeletedEvent.type === 'deleted') {
            this.annotationEntry = [{
              ...this.previousDeletedEvent,
              resourceId: this.serverURL
            }]
            this.annotationEventCallback({}, { type: 'aborted' })
          }
          this.annotationEntry = []
          features.forEach(feature => {
            this.annotationEntry.push({
              ...feature,
              resourceId: this.serverURL,
              featureId: feature.featureId ? feature.featureId : feature.feature?.id,
              offline: this.offlineAnnotationEnabled
            })
          });
          // Drawn feature annotationEntry will always have length of 1
          if (features[0].feature) {
            // in drawing or edit/delete mode is on or valid drawn
            if (this.activeDrawTool || this.activeDrawMode || this.isValidDrawnCreated) {
              this.featureAnnotationSubmitted = false
              if (this.activeDrawTool) {
                this.createConnectivityBody()
              }
              this.displayTooltip(
                features[0].feature.id,
                centroid(features[0].feature.geometry)
              )
            } else {
              this.rollbackAnnotationEvent()
            }
          } else {
            const featureIds = this.annotationEntry
              .filter(annotation => annotation.featureId && annotation.models)
              .map(annotation => annotation.models)
            if (featureIds.length > 0) {
              this.displayTooltip(featureIds)
            }
          }
        } else {
          this.annotation = {}
        }
      }
      // clicking on a connectivity explorer card will be same as exploration mode
      // since the card should be opened
      else if (this.viewingMode === 'Neuron Connection' && !connectivityExplorerClicked) {
        const resources = data.map(tooltip => tooltip.resource[0]);
        let pathsQueryAPI = this.retrieveConnectedPaths(resources); // TODO: to replace with queryAllConnectedPaths

        // filter out paths
        const featureId = resources.find(resource => !resource.startsWith('ilxtr:'));
        if (featureId) {
          // fallback if it cannot find in anatomical nodes
          const transformResources = Array.isArray(resources) ? [...resources] : [resources];
          if (transformResources.length === 1) {
            transformResources.push([]);
          }

          const featureId = data[0].feature?.featureId;
          const annotation = this.mapImp.annotations.get(featureId);
          const anatomicalNodes = annotation?.['anatomical-nodes'];
          const uniqueResource = anatomicalNodes ? JSON.parse(anatomicalNodes[0]) : transformResources;

          if (this.connectionType === 'Origin') {
            // Competency Query API
            // pathsQueryAPI = queryPathsByOrigin(this.flatmapAPI, this.mapImp.knowledgeSource, resources);

            // search by unique placement before competency API is ready for this
            pathsQueryAPI = filterPathsByOriginFromKnowledge(uniqueResource);
          } else if (this.connectionType === 'Via') {
            // Competency Query API
            // pathsQueryAPI = queryPathsByViaLocation(this.flatmapAPI, this.mapImp.knowledgeSource, resources);

            // search by unique placement before competency API is ready for this
            pathsQueryAPI = filterPathsByViaFromKnowledge(uniqueResource);
          } else if (this.connectionType === 'Destination') {
            // Competency Query API
            // pathsQueryAPI = queryPathsByDestination(this.flatmapAPI, this.mapImp.knowledgeSource, resources);

            // search by unique placement before competency API is ready for this
            pathsQueryAPI = filterPathsByDestinationFromKnowledge(uniqueResource);
          } else {
            pathsQueryAPI = queryAllConnectedPaths(this.flatmapAPI, this.mapImp.knowledgeSource, resources);
          }
          this.connectivityfilters.push({
            facet: JSON.stringify(uniqueResource),
            facetPropPath: `flatmap.connectivity.source.${this.connectionType.toLowerCase()}`,
            label: JSON.stringify(uniqueResource),
            term: this.connectionType
          })
          // TODO: to remove "neuron-connection-click"
          this.$emit('neuron-connection-feature-click', this.connectivityfilters);
        }

        // TODO: to clean up after verification
        // pathsQueryAPI.then(async (paths) => {
        //   if (paths.length) {
        //     const filteredPaths = paths.filter(path => (path in this.mapImp.pathways.paths))
        //     const filteredPathsWithData = [];
        //     let prom1 = [];
        //     let prom2 = [];

        //     for (let i = 0; i < filteredPaths.length; i++) {
        //       const path = filteredPaths[i];
        //       const modelFeatureIds = this.mapImp.modelFeatureIds(path);
        //       const feature = this.mapImp.featureProperties(modelFeatureIds[0]);
        //       if (feature) {
        //         const pathData = {
        //           resource: [feature.models],
        //           feature: feature,
        //           label: feature.label,
        //           provenanceTaxonomy: feature.taxons,
        //           alert: feature.alert,
        //         };
        //         filteredPathsWithData.push(pathData);
        //         prom1.push({
        //           title: pathData.label,
        //           featureId: [path]
        //         })
        //       }
        //     }
        //     this.tooltipEntry = await Promise.all(prom1)
        //     // Emit placeholders first.
        //     this.$emit('connectivity-info-open', this.tooltipEntry);

        //     /**
        //      * This event is emitted to highlight the same paths on other display maps.
        //      */
        //     this.$emit('neuron-connection-click', paths);

        //     // loading data
        //     for (let i = 0; i < filteredPathsWithData.length; i++) {
        //       const pathData = filteredPathsWithData[i];
        //       const tooltipEntryData = await this.getKnowledgeTooltip(pathData);
        //       prom2.push(tooltipEntryData)
        //     }
        //     this.tooltipEntry = await Promise.all(prom2)
        //     this.displayTooltip(filteredPaths)
        //   }
        // })
      } else {
        // load and store knowledge
        loadAndStoreKnowledge(this.mapImp, this.flatmapQueries);
        let prom1 = []
        // Emit placeholders first.
        // This may contain invalid connectivity.
        this.tooltipEntry = data
          .filter(tooltip => tooltip.resource[0] in this.mapImp.pathways.paths)
          .map((tooltip) => {
            return { title: tooltip.label, featureId: tooltip.resource, ready: false }
          })
        // this should only for flatmap paths not all features
        if (this.tooltipEntry.length) {
          this.$emit('connectivity-info-open', this.tooltipEntry);

          // While having placeholders displayed, get details for all paths and then replace.
          for (let index = 0; index < data.length; index++) {
            prom1.push(await this.getKnowledgeTooltip(data[index]))
          }
          this.tooltipEntry = await Promise.all(prom1)
          const featureIds = this.tooltipEntry.map(tooltip => tooltip.featureId[0])
          if (featureIds.length > 0) {
            this.displayTooltip(featureIds)
          }
        }
      }
    },
    resetConnectivityfilters: function () {
      this.connectivityfilters = [];
    },
    getKnowledgeTooltip: async function (data) {
      //require data.resource && data.feature.source
      const results = await this.flatmapQueries.retrieveFlatmapKnowledgeForEvent(this.mapImp, data)
      let tooltip = await this.flatmapQueries.createTooltipData(this.mapImp, data)
      // The line below only creates the tooltip if some data was found on the path
      // the pubmed URLs are in knowledge response.references
      if ((results && results[0]) || (data.feature.hyperlinks && data.feature.hyperlinks.length > 0)) {
        tooltip['featuresAlert'] = data.alert;
        tooltip['knowledgeSource'] = getKnowledgeSource(this.mapImp);
        // Map id and uuid to load connectivity information from the map
        tooltip['mapId'] = this.mapImp.provenance.id;
        tooltip['mapuuid'] = this.mapImp.provenance.uuid;
      // } else {
      //   tooltip = {
      //     ...tooltip,
      //     origins: [data.label],
      //     originsWithDatasets: [{ id: data.resource[0], name: data.label }],
      //     components: [],
      //     componentsWithDatasets: [],
      //     destinations: [],
      //     destinationsWithDatasets: [],
      //   }
      //   let featureIds = []
      //   const pathsOfEntities = await this.mapImp.queryPathsForFeatures(data.resource)
      //   if (pathsOfEntities.length) {
      //     pathsOfEntities.forEach((path) => {
      //       featureIds.push(...this.mapImp.pathModelNodes(path))
      //       const searchResults = this.mapImp.search(path)
      //       let featureId = undefined;
      //       for (let i = 0; i < searchResults.results.length; i++) {
      //         featureId = searchResults.results[i].featureId
      //         const annotation = this.mapImp.annotation(featureId)
      //         if (featureId && annotation?.label) break;
      //       }
      //       if (featureId) {
      //         const feature = this.mapImp.featureProperties(featureId)
      //         if (feature.label && !tooltip.components.includes(feature.label)) {
      //           tooltip.components.push(feature.label)
      //           tooltip.componentsWithDatasets.push({ id: feature.models, name: feature.label })
      //         }
      //       }
      //     })
      //     featureIds = [...new Set(featureIds)].filter(id => id !== data.feature.featureId)
      //     featureIds.forEach((id) => {
      //       const feature = this.mapImp.featureProperties(id)
      //       if (feature.label && !tooltip.destinations.includes(feature.label)) {
      //         tooltip.destinations.push(feature.label)
      //         tooltip.destinationsWithDatasets.push({ id: feature.models, name: feature.label })
      //       }
      //     })
      //   }
      }
      tooltip['ready'] = true;
      return tooltip;
    },
    /**
     * A hack to remove flatmap tooltips while popup is open
     */
    popUpCssHacks: function () {
      // Below is a hack to remove flatmap tooltips while popup is open
      const ftooltip = document.querySelector('.flatmap-tooltip-popup')
      const popupCloseButton = document.querySelector('.maplibregl-popup-close-button')
      if (ftooltip) ftooltip.style.display = 'none'
      popupCloseButton.style.display = 'block'
      this.$refs.tooltip.$el.style.display = 'flex'
      popupCloseButton.onclick = () => {
        /**
         * This event is emitted
         * when a connectivity info (provenance popup) is closed.
         */
        this.$emit('connectivity-info-close');
        if (ftooltip) ftooltip.style.display = 'block'
      }
    },
    /**
     * @public
     * Function to close tooltip.
     */
    closeTooltip: function () {
      if (this.$refs.tooltip) {
        this.$refs.tooltip.$el.style.display = 'none'
      }
      document.querySelectorAll('.maplibregl-popup').forEach((item) => {
        item.style.display = 'none'
      })
    },
    /**
     * @public
     * Function to show popup on map.
     * @arg {String} `featureId`,
     * @arg {Object} `node`,
     * @arg {Object} `options`
     */
    showPopup: function (featureId, node, options) {
      // Keeping this as an API
      let myOptions = options
      if (this.mapImp) {
        if (myOptions) {
          if (!myOptions.className) myOptions.className = 'custom-popup'
        } else {
          myOptions = { className: 'custom-popup', positionAtLastClick: true }
        }
        this.mapImp.showPopup(featureId, node, myOptions)
      }
    },
    /**
     * @public
     * Function to show marker popup.
     * @arg {String} `featureId`,
     * @arg {Object} `node`,
     * @arg {Object} `options`
     */
    showMarkerPopup: function (featureId, node, options) {
      if (this.mapImp) {
        this.mapImp.showMarkerPopup(featureId, node, options)
      }
    },
    /**
     * @public
     * Function to close minimap.
     */
    closeMinimap: function () {
      let minimapEl = this.$refs.flatmapContainer.querySelector(
        '.maplibregl-ctrl-minimap'
      ) // find minimap
      if (this.minimapSmall) {
        //switch the classes on the minimap
        minimapEl.classList.add('enlarge')
        minimapEl.classList.remove('shrink')
      } else {
        minimapEl.classList.add('shrink')
        minimapEl.classList.remove('enlarge')
      }
      this.minimapSmall = !this.minimapSmall
    },
    /**
     * Function to add resize button to minimap.
     */
    addResizeButtonToMinimap: function () {
      let minimapEl = this.$refs.flatmapContainer.querySelector(
        '.maplibregl-ctrl-minimap'
      )
      if (minimapEl) {
        if (this.$refs.minimapResize &&
        this.$refs.minimapResize.$el.parentNode) {
          this.$refs.minimapResize.$el.parentNode.removeChild(
            this.$refs.minimapResize.$el)
        }
        minimapEl.appendChild(this.$refs.minimapResize.$el)
        this.minimapResizeShow = true
      }
    },
    /**
     * @public
     * Function to set help mode
     * by providing flag ``helpMode`` (true/false).
     * @arg {Boolean} `helpMode`
     */
    setHelpMode: function (helpMode) {
      const toolTipsLength = this.hoverVisibilities.length;
      const lastIndex = toolTipsLength - 1;
      const activePopoverObj = this.hoverVisibilities[this.helpModeActiveIndex];

      if (activePopoverObj) {
        const popoverRefsId = activePopoverObj?.refs;
        const popoverRefId = activePopoverObj?.ref;
        const popoverRef = this.$refs[popoverRefsId ? popoverRefsId : popoverRefId];

        if (popoverRef) {
          // Open pathway drawer if the tooltip is inside or beside
          const { parentElement, nextElementSibling } = popoverRef.$el;
          const isPathwayContainer = (element) => {
            return element && (
              element.classList.contains('pathway-container') ||
              element.classList.contains('pathway-location')
            );
          };

          if (
            isPathwayContainer(parentElement) ||
            isPathwayContainer(nextElementSibling)
          ) {
            if (this.requiresDrawer) {
              this.drawerOpen = true;
            } else {
              this.helpModeActiveIndex += 1;
            }
          }
        } else {
          // skip the unavailable tooltips
          this.helpModeActiveIndex += 1;
        }
      }

      if (!helpMode) {
        // reset to iniital state
        this.helpModeActiveIndex = this.helpModeInitialIndex;
      }

      if (this.viewingMode !== 'Annotation' && this.helpModeActiveIndex > 9) {
        this.helpModeActiveIndex = lastIndex
      }

      if (helpMode && this.helpModeActiveIndex >= lastIndex) {
        /**
         * This event is emitted when the tooltips in help mode reach the last item.
         */
        this.$emit('help-mode-last-item', true);
      }

      if (helpMode && !this.helpModeDialog) {
        this.inHelp = true;
        this.hoverVisibilities.forEach((item) => {
          item.value = true;
        });
      } else if (helpMode && this.helpModeDialog && toolTipsLength > this.helpModeActiveIndex) {

        // Show the map tooltip as first item
        if (this.helpModeActiveIndex > -1) {
          this.closeFlatmapHelpPopup();

          // wait for CSS transition
          setTimeout(() => {
            this.inHelp = false;
            this.hoverVisibilities.forEach((item) => {
              item.value = false;
            });

            this.showTooltip(this.helpModeActiveIndex, 200);
          }, 300);
        } else if (this.helpModeActiveIndex === -1) {
          this.openFlatmapHelpPopup();
        }
      } else {
        this.inHelp = false
        this.hoverVisibilities.forEach((item) => {
          item.value = false
        })
        this.closeFlatmapHelpPopup()
      }
    },
    /**
     * @public
     * Function to show tooltip
     * by providing ``tooltipNumber``.
     * @arg {Number} `tooltipNumber`
     * @arg {Number} `timeout` _(default: `500`)_
     */
    showTooltip: function (tooltipNumber, timeout = 500) {
      if (!this.inHelp) {
        clearTimeout(this.tooltipWait[tooltipNumber])
        this.tooltipWait[tooltipNumber] = setTimeout(() => {
          this.hoverVisibilities[tooltipNumber].value = true
          /**
           * This event is emitted after a tooltip in Flatmap is shown.
           */
          this.$emit('shown-tooltip');
        }, timeout)
      }
    },

    /**
     * @public
     * Function to hide tooltip
     * by providing ``tooltipNumber``.
     * @arg {Number} `tooltipNumber`
     * @arg {Number} `timeout` _(default: `500`)_
     */
    hideTooltip: function (tooltipNumber, timeout = 500) {
      if (!this.inHelp) {
        clearTimeout(this.tooltipWait[tooltipNumber])
        this.tooltipWait[tooltipNumber] = setTimeout(() => {
          this.hoverVisibilities[tooltipNumber].value = false
        }, timeout)
      }
    },
    /**
     * @public
     * Function to display tooltip
     * by providing featureId (``feature``).
     * @arg {String} `feature`
     * @arg {String} `geometry` _(default: `undefined`)_
     */
    displayTooltip: function (feature, geometry = undefined) {
      let featureId = undefined
      let options = { className: 'flatmapvuer-popover' }
      if (geometry) {
        featureId = feature
        options.annotationFeatureGeometry = geometry
      } else {
        const entry = Array.isArray(feature) ? feature[0] : feature
        if (entry) {
          featureId = this.mapImp.modelFeatureIds(entry)[0]
        }
        if (!this.activeDrawTool) {
          options.positionAtLastClick = true
        }
      }
      // If connectivityInfoSidebar is set to `true`
      // Connectivity info will show in sidebar
      if (
        (this.connectivityInfoSidebar && this.tooltipEntry.length) &&
        this.viewingMode !== 'Annotation'
      ) {
        if (this.checkConnectivityTooltipEntry(this.tooltipEntry)) {
          this.$emit('connectivity-info-open', this.tooltipEntry);
        }
      }
      if (this.annotationSidebar && this.viewingMode === 'Annotation') {
        this.$emit('annotation-open', {annotationEntry: this.annotationEntry, commitCallback: this.commitAnnotationEvent});
      }
      // If UI is not disabled,
      // And connectivityInfoSidebar is not set (default) or set to `false`
      // Provenance popup will be shown on map
      // Tooltip will be shown for Annotation view
      if (
        featureId &&
        !this.disableUI &&
        (
          (this.viewingMode === 'Annotation' && !this.annotationSidebar) ||
          (this.viewingMode === 'Exploration' && !this.connectivityInfoSidebar)
        )
      ) {
        this.tooltipDisplay = true;
        this.$nextTick(() => {
          this.mapImp.showPopup(featureId, this.$refs.tooltip.$el, options);
          this.popUpCssHacks();
        });
      }
    },
    /**
     * Move the map to the left side
     * to the visible area of the feature IDs
     * because the sidebar is opened
     * @arg featureIds
     */
     moveMap: function (featureIds, options = {}) {
      if (this.mapImp) {
        const { offsetX = 0, offsetY = 0, zoom = 4 } = options;
        const Map = this.mapImp.map;
        const bbox = this.mapImp.bounds.toArray();

        // Zoom the map to features first
        this.mapImp.zoomToFeatures(featureIds, { noZoomIn: true });

        // Hide the left pathway drawer
        // to get more space for the map
        this.showPathwaysDrawer(false);

        // Move the map to left side
        // since the sidebar is taking space on the right
        if (bbox?.length) {
          setTimeout(() => {
            Map.fitBounds(bbox, {
              offset: [offsetX, offsetY],
              zoom: zoom,
              animate: true
            });
          });
        }
      }
    },
    /**
     * @public
     * Function to open Flatmap Help Popup.
     */
    openFlatmapHelpPopup: function () {
      if (this.mapImp) {
        let heartId = this.mapImp.modelFeatureIds('UBERON:0000948')
        if (heartId && heartId.length > 0) {
          const elm = 'Click for more information'
          this.mapImp.showPopup(heartId[0], elm, {
            anchor: 'top',
            className: 'flatmap-popup-popper',
          })
          /**
           * This event is emitted after a tooltip on Flatmap's map is shown.
           */
          this.$emit('shown-map-tooltip');
        }
      }
    },
    /**
     * @public
     * Function to close Flatmap Help Popup.
     */
    closeFlatmapHelpPopup: function () {
      this.$el
        .querySelectorAll('.maplibregl-popup-close-button')
        .forEach((item) => {
          item.click()
        })
    },
    /**
     * @public
     * Function to get annotation labels.
     */
    getLabels: function () {
      let labels = []
      if (this.mapImp) {
        let annotations = this.mapImp.annotations
        for (let value of annotations.values()) {
          if (value.label) labels.push(value.label)
        }
        return Array.from(new Set(labels))
      }
    },
    /**
     * Function to get and store the state (object) of the map in
     * the provided argument
     */
    getVisibilityState: function (state) {
      const refs = ['alertSelection', 'pathwaysSelection', 'taxonSelection']
      refs.forEach(ref => {
        let comp = this.$refs[ref]
        if (comp) {
          state[ref] = comp.getState()
        }
      })
      if (this.$refs.treeControls) {
        const checkedKeys = this.$refs.treeControls.$refs.regionTree.getCheckedKeys();
        //Only store first level systems (terms without .)
        state['systemsSelection'] = checkedKeys.filter(term => !term.includes('.'))
      }
    },
    /**
     * Function to set and restore the visibility state (object) of
     * the map with the provided argument
     */
    setVisibilityState: function (state) {
      const refs = ['alertSelection', 'pathwaysSelection', 'taxonSelection']
      refs.forEach(ref => {
        const settings = state[ref]
        if (settings) {
          const comp = this.$refs[ref]
          if (comp) {
            comp.setState(settings)
          }
        }
      })
      if ('systemsSelection' in state) {
        if (this.$refs.treeControls) {
          this.$refs.treeControls.$refs.regionTree.setCheckedKeys(state['systemsSelection']);
          this.systems[0].children.forEach((item) => {
            this.mapImp.enableSystem(item.key, state['systemsSelection'].includes(item.key))
          })
        }
      }
    },
    /**
     * @public
     * Function to get the state (object) of the map.
     */
    getState: function () {
      if (this.mapImp) {
        let state = {
          entry: this.entry,
          viewport: this.mapImp.getState(),
        }
        const identifier = this.mapImp.getIdentifier()
        if (this.biologicalSex) state['biologicalSex'] = this.biologicalSex
        else if (identifier && identifier.biologicalSex)
          state['biologicalSex'] = identifier.biologicalSex
        if (identifier && identifier.uuid) state['uuid'] = identifier.uuid
        state['viewingMode'] = this.viewingMode
        state['searchTerm'] = this.searchTerm
        state['flightPath3D'] = this.flightPath3DRadio
        state['colour'] = this.colourRadio
        state['outlines'] = this.outlinesRadio
        state['background'] = this.currentBackground
        if (this.offlineAnnotationEnabled) {
          state['offlineAnnotations'] = sessionStorage.getItem('anonymous-annotation')
        }
        this.getVisibilityState(state)
        return state
      }
      return undefined
    },
    /**
     * @public
     * Function to set state (object) for the map.
     * @arg {Object} `state`
     */
    setState: function (state) {
      if (state) {
        if (
          this.mapImp &&
          state.entry &&
          this.entry == state.entry &&
          (!state.biologicalSex || state.biologicalSex === this.biologicalSex)
        ) {
          this.restoreMapState(state)
        } else {
          this.createFlatmap(state)
        }
        this.setStateRequired = false
      }
    },
    /**
     * @public
     * Function to restore map's state
     * from the ``state`` provided.
     * @arg {Object} `state`
     */
    restoreMapState: function (state) {
      if (state) {
        if (state.viewport) this.mapImp.setState(state.viewport)
        if (state.offlineAnnotations) {
          sessionStorage.setItem('anonymous-annotation', state.offlineAnnotations)
        }
        if (state.viewingMode) this.changeViewingMode(state.viewingMode)
        //The following three are boolean
        if ('flightPath3D' in state) this.setFlightPath3D(state.flightPath3D)
        if ('colour' in state) this.setColour(state.colour)
        if ('outlines' in state) this.setOutlines(state.outlines)
        if (state.background) this.backgroundChangeCallback(state.background)
        if (state.searchTerm) {
          const searchTerm = state.searchTerm
          this.searchAndShowResult(searchTerm, true)
        }
        this.setVisibilityState(state)
      }
    },
    /**
     * @public
     * Function to show flight path option
     * (3D option)
     * based on the map version (currently 1.6 and above).
     * @arg {String} `mapVersion`
     */
    setFlightPathInfo: function (mapVersion) {
      const mapVersionForFlightPath = 1.6
      if (mapVersion === mapVersionForFlightPath || mapVersion > mapVersionForFlightPath) {
        // Show flight path option UI
        this.displayFlightPathOption = true
        // Show 2D as default on FC type
        this.setFlightPath3D(false)
      }
    },
    /**
     * @public
     * Function to create Flatmap
     * by providing the ``state``.
     * @arg {Object} `state`
     */
    createFlatmap: function (state) {
      if (!this.mapImp && !this.loading) {
        this.loading = true
        let minimap = false
        if (this.displayMinimap) {
          minimap = { position: 'top-right' }
        }

        //As for flatmap-viewer@2.2.7, see below for the documentation
        //for the identifier:

        //@arg identifier {string|Object}
        // A string or object identifying the map to load. If a string its
        // value can be either the map's ``uuid``, assigned at generation time,
        // or taxon and biological sex identifiers of the species that the map
        // represents. The latest version of a map is loaded unless it has been
        // identified using a ``uuid`` (see below).
        // @arg identifier.taxon {string} The taxon identifier of the species
        //  represented by the map. This is specified as metadata in the map's source file.
        // @arg identifier.biologicalSex {string} The biological sex of the species
        // represented by the map. This is specified as metadatain the map's source file.
        // @arg identifier.uuid {string} The unique uuid the flatmap. If given then this exact map will
        //  be loaded, overriding ``taxon`` and ``biologicalSex``.

        let identifier = { taxon: this.entry }
        if (this.uuid) {
          identifier.uuid = this.uuid
        }
        //This now handle the uses of uuid when resuming states
        if (state) {
          if (state.uuid) {
            identifier = { uuid: state.uuid }
          } else if (state.entry) {
            identifier.taxon = state.entry
          }
          if (state.biologicalSex) {
              identifier['biologicalSex'] = state.biologicalSex;
          } else if (identifier.taxon === 'NCBITaxon:9606') {
            //For backward compatibility
            identifier['biologicalSex'] = 'PATO:0000384';
          }
        } else {
          // Set the bioloicalSex now if map is not resumed from
          // a saved state
          if (this.biologicalSex) {
            identifier['biologicalSex'] = this.biologicalSex
          }
        }

        let promise1 = this.mapManagerRef.loadMap(
          identifier,
          this.eventCallback(),
          {
            //fullscreenControl: false,
            //annotatable: false,
            //debug: true,
            minZoom: this.minZoom,
            tooltips: this.tooltips,
            minimap: minimap,
            container: this.$refs.display,
            // tooltipDelay: 15, // new feature to delay tooltips showing
          }
        )
        promise1.then((returnedObject) => {
          this.mapImp = returnedObject
          this.serverURL = this.mapImp.makeServerUrl('').slice(0, -1)
          let mapVersion = this.mapImp.details.version
          this.setFlightPathInfo(mapVersion)
          const stateToSet = this._stateToBeSet ? this._stateToBeSet : state
          this.onFlatmapReady(stateToSet)
          this.$nextTick(() => this.restoreMapState(stateToSet))
        })
      } else if (state) {
        this._stateToBeSet = {
          ...state
        }
        if (this.mapImp && !this.loading) {
          this.restoreMapState(this._stateToBeSet)
        }
      }
    },
    /**
     * @public
     * Function to compute path controls maximum height.
     */
    computePathControlsMaximumHeight() {
      const elem = this.$refs.display
      if (elem) {
        const computed = getComputedStyle(elem)
        const padding =
          parseInt(computed.paddingTop) + parseInt(computed.paddingBottom)
        const height = elem.clientHeight - padding
        this.pathwaysMaxHeight = height - 170
      }
    },
    /**
     * @public
     * Function to resize the map.
     */
    mapResize: function () {
      try {
        this.computePathControlsMaximumHeight()
        if (this.mapImp) {
          this.mapImp.resize()
          this.showMinimap(this.displayMinimap)
        }
      } catch {
        console.error('Map resize error')
      }
    },
    getFilterSources: function () {
      const FILTER_PROPERTIES = ['kind', 'taxons']
      let withAlert = new Set()
      let withoutAlert = new Set()
      let filterSourcesMap = new Map()
      for (const annotation of this.mapImp.annotations.values()) {
        if (annotation.source) {
          if ("alert" in annotation) {
            withAlert.add(annotation.source)
          } else {
            withoutAlert.add(annotation.source)
          }
          for (const [key, value] of Object.entries(annotation)) {
            if (FILTER_PROPERTIES.includes(key)) {
              if (!filterSourcesMap.has(key)) {
                filterSourcesMap.set(key, new Map())
              }
              const sourceMap = filterSourcesMap.get(key)
              const addToSourceMap = (val) => {
                const setKey = val
                if (!sourceMap.has(setKey)) {
                  sourceMap.set(setKey, new Set())
                }
                sourceMap.get(setKey).add(`${annotation.source}`)
              };
              if (Array.isArray(value)) {
                value.forEach(addToSourceMap)
              } else {
                addToSourceMap(value)
              }
            }
          }
        }
      }
      let filterSources = {
        'alert': {
          'with': [...withAlert],
          'without': [...withoutAlert]
        }
      }
      for (const [key, value] of filterSourcesMap.entries()) {
        filterSources[key] = {}
        for (const [key1, value1] of value.entries()) {
          filterSources[key][key1] = [...value1.values()]
        }
      }
      return filterSources
    },
    getFilterOptions: async function () {
      if (this.mapImp) {
        let filterOptions = []
        const filterRanges = this.mapImp.featureFilterRanges()
        for (const [key, value] of Object.entries(filterRanges)) {
          let main = {
            key: `flatmap.connectivity.${key}`,
            label: "",
            children: []
          }
          let children = []
          if (key === "kind") {
            main.label = "Pathways"
            for (const facet of value) {
              const pathway = this.pathways.find(path => path.type === facet)
              if (pathway) {
                children.push({
                  key: `${main.key}.${facet}`,
                  label: pathway.label,
                  colour: pathway.colour,
                  colourStyle: 'line',
                  dashed: pathway.dashed,
                })
              }
            }
          } else if (key === "taxons") {
            main.label = "Studied in"
            const entityLabels = await findTaxonomyLabels(this.mapImp, this.mapImp.taxonIdentifiers)
            if (entityLabels.length) {
              for (const facet of value) {
                const taxon = entityLabels.find(p => p.taxon === facet)
                if (taxon) {
                  children.push({
                    key: `${main.key}.${facet}`,
                    // space added at the end of label to make sure the display name will not be updated
                    // prevent sidebar searchfilter convertReadableLabel
                    label: `${taxon.label} `
                  })
                }
              }
            }
          } else if (key === "alert") {
            main.label = "Alert"
            for (const facet of ["with", "without"]) {
              children.push({
                key: `${main.key}.${facet}`,
                label: `${facet} alerts`
              })
            }
          }
          main.children = children.sort((a, b) => a.label.localeCompare(b.label));
          if (main.label && main.children.length) {
            filterOptions.push(main)
          }
        }
        const connectionFilters = [];
        const flatmapKnowledge = this.getFlatmapKnowledge();
        const originItems = extractOriginItems(flatmapKnowledge);
        const viaItems = extractViaItems(flatmapKnowledge);
        const destinationItems = extractDestinationItems(flatmapKnowledge);

        const transformItem = (facet, item) => {
          const label = JSON.stringify(item);
          return {
            key: `flatmap.connectivity.source.${facet}.${label}`,
            label: label
          };
        }

        for (const facet of ["origin", "via", "destination"]) {
          let childrenList = []
          if (facet === 'origin') {
            childrenList = originItems.map((item) => transformItem(facet, item));
          } else if (facet === 'via') {
            childrenList = viaItems.map((item) => transformItem(facet, item));
          } else if (facet === 'destination') {
            childrenList = destinationItems.map((item) => transformItem(facet, item));
          }

          connectionFilters.push({
            key: `flatmap.connectivity.source.${facet}`,
            label: facet,
            children: childrenList,
          })
        }

        filterOptions.push(...connectionFilters)
        return filterOptions
      }
    },
    /**
     * @public
     * This function is used for functions that need to run immediately after the flatmap is loaded.
     */
    onFlatmapReady: function (state) {
      // onFlatmapReady is used for functions that need to run immediately after the flatmap is loaded
      this.sensor = markRaw(new ResizeSensor(this.$refs.display, this.mapResize))
      if (this.mapImp.options?.style === 'functional') {
        this.isFC = true
      }
      this.mapImp.setBackgroundOpacity(1)
      this.backgroundChangeCallback(this.currentBackground)
      this.pathways = this.mapImp.pathTypes()
      this.pathways = this.pathways.filter(path => {
        return path.enabled && path.type !== 'other'
      })
      //Disable layers for now
      //this.layers = this.mapImp.getLayers();
      this.processSystems(this.mapImp.getSystems())
      //Async, pass the state for checking
      this.processTaxon(this.mapImp.taxonIdentifiers, state ? state['taxonSelection'] : undefined)
      this.containsAlert = "alert" in this.mapImp.featureFilterRanges()
      this.addResizeButtonToMinimap()
      this.loading = false
      this.computePathControlsMaximumHeight()
      this.mapResize()
      this.handleMapClick();
      this.setInitMapState();
      /**
       * This is ``onFlatmapReady`` event.
       * @arg ``this`` (Component Vue Instance)
       */
      this.$emit('ready', this)
    },
    /**
     * @public
     * Function to handle mouse click on map area
     * after the map is loaded.
     */
    handleMapClick: function () {
      const _map = this.mapImp.map;
      if (_map) {
        _map.on('click', (e) => {
          if (!this.connectivityDataSource) {
            this.$emit('connectivity-info-close');
          }
          this.connectivityDataSource = ''; // reset
        });
      }
    },
    /**
     * @public
     * Function to show or hide the minimap
     * by providing ``flag`` (boolean) value.
     * @arg {Boolean} `flag`
     */
    showMinimap: function (flag) {
      if (this.mapImp) this.mapImp.showMinimap(flag)
    },
    /**
     * @public
     * Function to show or hide the pathways drawer
     * by providing ``flag`` (boolean) value.
     * @arg {Boolean} `flag`
     */
    showPathwaysDrawer: function (flag) {
      this.drawerOpen = flag
    },
    /**
     * @public
     * Function to display features with annotation matching the provided term,
     * with the option to display the label/connectivity information using displayInfo flag.
     * @arg {String} `term`,
     * @arg {String} `displayInfo`
     */
    searchAndShowResult: function (term, displayInfo, connectivityExplorerClicked) {
      if (this.mapImp) {
        if (term === undefined || term === '') {
          this.mapImp.clearSearchResults()
          if (this.viewingMode === "Exploration") {
            this.$emit('connectivity-info-close');
          } else if (this.viewingMode === "Annotation") {
            this.manualAbortedOnClose()
          }
          this.searchTerm = ""
          return true
        } else {
          const searchResults = this.mapImp.search(term)
          if (searchResults?.results?.length) {
            this.mapImp.showSearchResults(searchResults)
            if (displayInfo) {
              let featureId = undefined;
              for (let i = 0; i < searchResults.results.length; i++) {
                featureId = searchResults.results[i].featureId
                const annotation = this.mapImp.annotation(featureId)
                if (featureId && annotation?.label) break;
              }
              if (featureId) {
                const feature = this.mapImp.featureProperties(featureId)
                const data = {
                  resource: [feature.models],
                  feature: feature,
                  label: feature.label,
                  provenanceTaxonomy: feature.taxons,
                  alert: feature.alert,
                }
                // Show popup for all modes
                this.checkAndCreatePopups([data], connectivityExplorerClicked)
                this.mapImp.showPopup(featureId, capitalise(feature.label), {
                  className: 'custom-popup',
                  positionAtLastClick: false,
                  preserveSelection: true,
                })
              }
            }
            this.searchTerm = term
            return true
          } else this.mapImp.clearSearchResults()
        }
      }
      return false
    },
    /**
     * @public
     * Public method to highlight connected paths for neuron connection mode,
     * to highlight paths for other display maps on spit screen.
     * @arg {Array} `paths`
     */
    highlightConnectedPaths: function (paths) {
      if (paths.length) {
        // filter paths for this map
        const filteredPaths = paths.filter(path => (path in this.mapImp.pathways.paths))
        // this.zoomToFeatures is replaced with selectGeoJSONFeatures to highlight paths
        const featureIdsToHighlight = this.mapImp.modelFeatureIdList(filteredPaths);
        this.mapImp.selectGeoJSONFeatures(featureIdsToHighlight);
      }
    },
    /**
     * @public
     * Function to show search suggestions
     * from the ``term`` provided.
     * @arg {String} `term`
     */
    searchSuggestions: function (term) {
      if (this.mapImp) return this.mapImp.search(term)
      return []
    },
    onActionClick: function (data) {
      EventBus.emit('onActionClick', data)
    },
    setConnectionType: function (type) {
      this.connectionType = type;
    },
  },
  props: {
    /**
     * The taxon identifier of the species represented by the map.
     */
    entry: {
      type: String,
      required: true,
    },
    /**
     * The unique ``uuid`` of the flatmap.
     * If given then this exact map will be loaded,
     * overriding ``taxon`` and ``biologicalSex``.
     */
    uuid: String,
    /**
     * The biological sex of the species represented by the map.
     * This is specified as metadata in the map's source file.
     */
    biologicalSex: {
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
     * The option to add another feature label _(`FeatureSmallSymbolLayer`)_
     * when this `tooltips` is set to `false`.
     */
    tooltips: {
      type: Boolean,
      default: true,
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
     * The initial index number for help mode tooltips.
     * Set negative (e.g. -2) if there are other tooltips outside of `hoverVisibilities`.
     */
    helpModeInitialIndex: {
      type: Number,
      default: 0,
    },
    /**
     * The option to create map on component mounted.
     */
    renderAtMounted: {
      type: Boolean,
      default: true,
    },
    /**
     * The option to display minimap at the top-right corner of the map.
     */
    displayMinimap: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show warning. Example for legacy or beta maps.
     */
    displayWarning: {
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
      default: function () {
        return [
          {
            display: 'Open AC Map',
            key: 'AC',
          },
          {
            display: 'Open FC Map',
            key: 'FC',
          },
          {
            display: 'Open 3D Human Map',
            key: '3D',
          },
        ]
      },
    },
    /**
     * The option to show star in legend area.
     */
    showStarInLegend: {
      type: Boolean,
      default: false,
    },
    /**
     * Flag to determine whether this is legacy map or not.
     * ``displayWarning`` should be shown for legacy map.
     */
    isLegacy: {
      type: Boolean,
      default: false,
    },
    /**
     * The option to show the latest changes.
     */
    displayLatestChanges: {
      type: Boolean,
      default: false,
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
     * if the FlatmapVuer is loaded from MultiFlatmapVuer.
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
     * The option to show annotation in sidebar
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
  },
  provide() {
    return {
      flatmapAPI: this.flatmapAPI,
      sparcAPI: this.sparcAPI,
      userApiKey: this.userToken,
    }
  },
  data: function () {
    return {
      sensor: null,
      mapManagerRef: undefined,
      flatmapQueries: undefined,
      annotationEntry: [],
      //tooltip display has to be set to false until it is rendered
      //for the first time, otherwise it may display an arrow at a
      //undesired location.
      tooltipDisplay: false,
      serverURL: undefined,
      layers: [],
      pathways: [],
      initMapState: markRaw({}),
      sckanDisplay: [
        {
          label: 'Display Path with SCKAN',
          key: 'VALID',
        },
      ],
      systems: [],
      taxonConnectivity: [],
      pathwaysMaxHeight: 1000,
      tooltipWait: markRaw([]),
      hoverVisibilities: [
        { value: false, ref: 'markerPopover' }, // 0
        { value: false, ref: 'zoomInPopover' }, // 1
        { value: false, ref: 'zoomOutPopover' }, // 2
        { value: false, ref: 'zoomFitPopover' }, // 3
        { value: false, ref: 'openMapPopover' }, // 4
        { value: false, ref: 'settingsPopover' }, // 5
        { value: false, ref: 'checkBoxPopover' }, // 6
        { value: false, ref: 'warningPopover' }, // 7
        { value: false, ref: 'whatsNewPopover' }, // 8
        { value: false, ref: 'featuredMarkerPopover' }, // 9
        { value: false, refs: "toolbarPopover", ref: "editPopover" }, // 10
        { value: false, refs: "toolbarPopover", ref: "deletePopover" }, // 11
        { value: false, refs: "toolbarPopover", ref: "pointPopover" }, // 12
        { value: false, refs: "toolbarPopover", ref: "lineStringPopover" }, // 13
        { value: false, refs: "toolbarPopover", ref: "polygonPopover" }, // 14
        { value: false, refs: "toolbarPopover", ref: "connectionPopover" }, // 15
      ],
      helpModeActiveIndex: this.helpModeInitialIndex,
      yellowstar: yellowstar,
      isFC: false,
      inHelp: false,
      currentBackground: 'white',
      availableBackground: ['white', 'lightskyblue', 'black'],
      loading: false,
      flatmapMarker: flatmapMarker,
      tooltipEntry: [],
      connectivityDataSource: '',
      connectivityTooltipVisible: false,
      drawerOpen: false,
      flightPath3DRadio: false,
      displayFlightPathOption: false,
      colourRadio: true,
      outlinesRadio: true,
      minimapResizeShow: false,
      minimapSmall: false,
      currentActive: '',
      selectedDrawnFeature: undefined, // Clicked drawn annotation
      currentHover: '',
      viewingMode: 'Exploration',
      viewingModes: {
        'Exploration': 'Find relevant research and view detail of neural pathways by selecting a pathway to view its connections and data sources',
        'Neuron Connection': 'Discover Neuron connections by selecting a neuron and viewing its associated network connections',
        'Annotation': ['View feature annotations', 'Add, comment on and view feature annotations']
      },
      connectionType: 'All',
      offlineAnnotationEnabled: false,
      offlineAnnotations: [],
      annotationFrom: 'Anyone',
      annotatedSource: ['Anyone', 'Me', 'Others'],
      openMapRef: undefined,
      backgroundIconRef: undefined,
      toolbarOptions: [
        "Edit",
        "Delete",
        "Point",
        "LineString",
        "Polygon",
        "Connection",
      ],
      annotator: undefined,
      authorisedUser: undefined,
      activeDrawMode: undefined,
      activeDrawTool: undefined,
      featureAnnotationSubmitted: false,
      drawnCreatedEvent: {},
      previousEditEvent: {},
      previousDeletedEvent: {},
      connectionEntry: {},
      existDrawnFeatures: [], // Store all exist drawn features
      doubleClickedFeature: false,
      containsAlert: false,
      alertOptions: [
        {
          label: 'Display Path With Alerts',
          key: 'alert',
          enabled: true,
        },
        {
          label: 'Display Path Without Alerts',
          key: 'withoutAlert',
          enabled: true,
        },
      ],
      mapFilters: markRaw({
        alert: {
          with: true,
          without: true,
        }
      }),
      searchTerm: "",
      taxonLeaveDelay: undefined,
      connectivityfilters: [],
    }
  },
  computed: {
    ...mapState(useMainStore, ['userToken']),
    isValidDrawnCreated: function () {
      return Object.keys(this.drawnCreatedEvent).length > 0
    },
    requiresDrawer: function() {
      if (this.loading) {
        this.drawerOpen = false
        return false
      }
      if (!this.isFC) {
        this.drawerOpen = true
        return true
      } else {
        if ((this.systems?.length > 0) ||
          (this.containsAlert && this.alertOptions) ||
          (this.pathways?.length > 0) ||
          (this.taxonConnectivity?.length > 0)
        ) {
          this.drawerOpen = true
          return true
        }
      }
      this.drawerOpen = false
      return true
    },
    modeDescription: function () {
      let description = this.viewingModes[this.viewingMode]
      if (this.viewingMode === 'Annotation') {
        if (this.authorisedUser) {
          return description[1]
        }
        return description[0]
      }
      return description
    },
  },
  watch: {
    entry: function () {
      if (!this.state) this.createFlatmap()
    },
    helpMode: function (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.setHelpMode(newVal)
      }
    },
    helpModeActiveItem: function () {
      // just take the action from helpModeActiveItem
      // work with local value since the indexing is different
      if (this.helpMode) {
        this.helpModeActiveIndex += 1;
        this.setHelpMode(this.helpMode);
      }
    },
    state: {
      handler: function (state, oldVal) {
        if (state !== oldVal) {
          if (this.mapManagerRef) {
            this.setState(state)
          } else {
            //this component has not been mounted yet
            this.setStateRequired = true
          }
        }
      },
      immediate: true,
      deep: true,
    },
    viewingMode: function (mode) {
      this.clearAnnotationFeature()
      if (mode === 'Annotation') {
        this.loading = true
        this.annotator.authenticate(this.userToken).then((userData) => {
          if (userData.name && userData.email && userData.canUpdate) {
            this.authorisedUser = userData
            this.offlineAnnotationEnabled = false
          } else {
            this.authorisedUser = undefined
            this.offlineAnnotationEnabled = true
          }
          this.emitOfflineAnnotationUpdate();
          this.setFeatureAnnotated()
          this.addAnnotationFeature()
          this.loading = false
        })
      }
    },
    disableUI: function (isUIDisabled) {
      if (isUIDisabled) {
        this.closeTooltip()
      }
    },
    activeDrawTool: function (tool) {
      let coordinates = [];
      let lastClick = { x: null, y: null };
      const canvas = this.$el.querySelector('.maplibregl-canvas');
      const removeListeners = () => {
        canvas.removeEventListener('keydown', handleKeyboardEvent);
        canvas.removeEventListener('click', handleMouseEvent);
      };
      const handleKeyboardEvent = (event) => {
        if (!['Escape', 'Enter'].includes(event.key)) return;
        const isValidDraw =
          (tool === 'Point' && coordinates.length === 1) ||
          (tool === 'LineString' && coordinates.length >= 2) ||
          (tool === 'Polygon' && coordinates.length >= 3);
        if (event.key === 'Escape' || (event.key === 'Enter' && !isValidDraw)) {
          this.activeDrawTool = undefined;
        }
        removeListeners();
      };
      const handleMouseEvent = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const distance = Math.sqrt((x - lastClick.x) ** 2 + (y - lastClick.y) ** 2);
        if (distance < 8) {
          if (!this.isValidDrawnCreated) this.activeDrawTool = undefined;
          removeListeners();
          return;
        }
        lastClick = { x, y };
        coordinates.push(lastClick);
      };
      if (tool) {
        removeListeners();
        canvas.addEventListener('keydown', handleKeyboardEvent);
        canvas.addEventListener('click', handleMouseEvent);
      }
    }
  },
  created: function () {
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
  },
  mounted: function () {
    this.openMapRef = shallowRef(this.$refs.openMapRef)
    this.backgroundIconRef = shallowRef(this.$refs.backgroundIconRef)
    this.tooltipWait.length = this.hoverVisibilities.length
    this.flatmapQueries = markRaw(new FlatmapQueries())
    this.flatmapQueries.initialise(this.flatmapAPI)
    if (this.state) {
      //State is set and require to set the state
      if (this.setStateRequired) {
        this.setState(this.state)
      }
    } else if (this.renderAtMounted) {
      this.createFlatmap()
    }
    refreshFlatmapKnowledgeCache();
  },
}
</script>

<style lang="scss" scoped>

.beta-popovers {
  position: absolute;
  top: 90px;
  left: 16px;
  text-align: left;
  font-size: 25px;
}

.warning-icon,
.latest-changesicon {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 5px;
}

.warning-icon {
  color: $warning;

  &:hover {
    cursor: pointer;
  }
}

.warning-text {
  font-family: Asap, sans-serif;
  font-size: 15px;
  vertical-align: 5px;
}

.latest-map-text {
  color: $app-primary-color;
  font-family: Asap, sans-serif;
  font-size: 12px;
  margin-top: 5px;
  vertical-align: 10px;
  cursor: pointer;
}

.latest-changesicon {
  margin-top: 5px;
  color: $success;

  &:hover {
    cursor: pointer;
  }
}

.latest-changestext {
  font-family: Asap, sans-serif;
  font-size: 15px;
  vertical-align: 5px;
}

.flatmap-container {
  height: 100%;
  width: 100%;
}

.pathway-location {
  position: absolute;
  bottom: 0px;
  left: 0px;
  transform: translateX(0);
  transition: all var(--el-transition-duration);
  z-index: 99;
  display: flex;
  flex-direction: row;
  align-items: center;

  &.open {
    transform: translateX(0);
  }
  &.close {
    transform: translateX(-100%);
  }
}

.svg-legends-container {
  width: 70%;
  min-width:183px;
  height: auto;
  position: relative;
  max-height: 140px;
}

.pathway-container {
  float: left;
  padding-left: 16px;
  padding-right: 18px;
  text-align: left;
  overflow: auto;
  border: 1px solid rgb(220, 223, 230);
  border-left: 0;
  border-bottom: 0;
  padding-bottom: 16px;
  background: #ffffff;
  overflow-x: hidden;
  scrollbar-width: thin;
  transition: all var(--el-transition-duration);
  &.open {
    opacity: 1;
    position: relative;
    z-index: 2;
  }
  &.close {
    opacity: 0;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    box-shadow: inset 0 0 6px #c0c4cc;
  }
}

.convert-warning-icon-to-info {
  transform: rotate(180deg);
  color: #8300bf;
  height: 10px;
  width: auto;
}

.flatmap-marker-help {
  display: block;
  width: max-content;
  margin: 0.5rem;

  :deep(.flatmap-marker svg) {
    display: block;
    width: 28px;
    height: 28px;
  }
}

.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
}
.el-icon-arrow-down {
  font-size: 12px;
}
.demonstration {
  display: block;
  color: #8492a6;
  font-size: 14px;
  margin-bottom: 20px;
}

.tooltip {
  display: none;
}

:deep(.maplibregl-popup) {
  z-index: 10;
  max-width: 330px !important;
}

:deep(.flatmap-tooltip-popup),
:deep(.custom-popup) {
  &.maplibregl-popup-anchor-bottom {
    .maplibregl-popup-content {
      margin-bottom: 12px;
      &::after,
      &::before {
        top: 100%;
        border-width: 12px;
      }
      /* this border color controlls the color of the triangle (what looks like the fill of the triangle) */
      &::after {
        margin-top: -1px;
        border-color: rgb(255, 255, 255) transparent transparent transparent;
      }
      /* this border color controlls the outside, thin border */
      &::before {
        margin: 0 auto;
        border-color: $app-primary-color transparent transparent transparent;
      }
    }
  }
  &.maplibregl-popup-anchor-top {
    .maplibregl-popup-content {
      margin-top: 12px;
      &::after,
      &::before {
        top: auto;
        bottom: 100%;
        border-width: 12px;
      }
      /* this border color controlls the color of the triangle (what looks like the fill of the triangle) */
      &::after {
        border-color: transparent transparent rgb(255, 255, 255) transparent;
      }
      &::before {
        margin: 0 auto;
        margin-bottom: 1px;
        border-color: transparent transparent $app-primary-color transparent;
      }
    }
  }
  &.maplibregl-popup-anchor-left {
    margin-left: 8px;
    .maplibregl-popup-content {
      &::after,
      &::before {
        top: 50%;
        left: 0;
        border-width: 8px;
        margin-top: -8px;
        margin-left: -16px;
      }
      /* this border color controlls the color of the triangle (what looks like the fill of the triangle) */
      &::after {
        transform: translateX(1px);
        border-color: transparent rgb(255, 255, 255) transparent transparent;
      }
      &::before {
        border-color: transparent $app-primary-color transparent transparent;
      }
    }
  }
  &.maplibregl-popup-anchor-right {
    margin-right: 8px;
    .maplibregl-popup-content {
      &::after,
      &::before {
        top: 50%;
        right: 0;
        border-width: 8px;
        margin-top: -8px;
        margin-right: -16px;
      }
      /* this border color controlls the color of the triangle (what looks like the fill of the triangle) */
      &::after {
        transform: translateX(-1px);
        border-color: transparent transparent transparent rgb(255, 255, 255);
      }
      &::before {
        border-color: transparent transparent transparent $app-primary-color;
      }
    }
  }
  &.maplibregl-popup-anchor-top-left,
  &.maplibregl-popup-anchor-top-right,
  &.maplibregl-popup-anchor-bottom-left,
  &.maplibregl-popup-anchor-bottom-right {
    .maplibregl-popup-content {
      &::after,
      &::before {
        display: none;
      }
    }
  }
  .maplibregl-popup-content {
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    display: none;
    background: #fff;
    border: 1px solid $app-primary-color;
    padding-left: 6px;
    padding-right: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
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

    hr {
      margin: 0.5rem 0;
      border: 0;
      border-top: 1px solid var(--el-border-color);
    }
  }
  .maplibregl-popup-tip {
    display: none;
  }
}

:deep(.maplibregl-popup) {
  &.flatmap-marker-popup {
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    pointer-events: auto;
    background: #fff;
  }
}

/* Fix for chrome bug where under triangle pops up above one on top of it  */
.selector:not(*:root),
:deep(.flatmap-tooltip-popup) {
  .maplibregl-popup-content::after {
    top: 99.9%;
  }
}

:deep(.flatmap-tooltip-dialog) {
  .maplibregl-popup-tip {
    display: none;
  }
}

:deep(.flatmap-marker-popup){
  .maplibregl-popup-content {
    padding: 0px;
  }
}

:deep(.flatmapvuer-popover) {
  .maplibregl-popup-close-button {
    position: absolute;
    right: 0;
    top: 0;
    border: 0;
    border-radius: 0 3px 0 0;
    cursor: pointer;
    background-color: transparent;
    font-size: 2.5em;
    color: grey;
    transition: color 0.3s ease;

    &:hover {
      color: $app-primary-color;
    }
  }
}

.zoomIn, .zoomOut, .fitWindow {
  padding: 4px;
}

.yellow-star-legend {
  display: block;
  width: max-content;
  cursor: default;

  :deep(svg) {
    display: block;
  }
}

.settings-group {
  bottom: 16px;
  position: absolute;
  transition: all var(--el-transition-duration);
  &.open {
    left: 322px;
  }
  &.close {
    left: 24px;
  }
}

:deep(.background-popper.el-popover.el-popper) {
  padding: 5px 12px;
  background-color: #ffffff;
  border: 1px solid $app-primary-color;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.06);
  height: fit-content;
  min-width: 200px;
  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
    }
  }
}

:deep(.background-popper.el-popover.el-popper.h-auto) {
  height: auto !important;
}

:deep(.open-map-popper.el-popover.el-popper) {
  padding-top: 5px;
  padding-bottom: 5px;
  background-color: #ffffff;
  border: 1px solid $app-primary-color;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.06);
  min-width: 188px;

  .el-row ~ .el-row {
    margin-top: 8px;
  }

  .el-button {
    padding-top: 5px;
    padding-bottom: 5px;
    background: #f3e6f9;
    border-color: $app-primary-color;
    color: $app-primary-color;
  }

  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
    }
  }
}

.backgroundText {
  color: rgb(48, 49, 51);
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
}

.backgroundControl {
  display: flex;
}

.backgroundChoice {
  width: 20px;
  height: 20px;
  border: 1px solid rgb(144, 147, 153);
  margin-left: 20px;
  &.active {
    border: 2px solid $app-primary-color;
  }
  &:hover {
    cursor: pointer;
  }
  &.white {
    background-color: white;
    margin-left: 10px;
  }
  &.black {
    background-color: black;
  }
  &.lightskyblue {
    background-color: lightskyblue;
  }
}

.icon-button-container {
  display: inline-block;
}

.icon-button {
  height: 24px !important;
  width: 24px !important;
  color: $app-primary-color;

  &.open-map-button {
    margin-bottom:4px;
  }

  &:hover {
    cursor: pointer;
  }
}

.viewing-mode-title {
  font-size: 14px;
  font-weight: 600;
  color: $app-primary-color;
  margin: 8px;
  text-decoration: underline;
  cursor: pointer;
}

.viewing-mode-unselected {
  font-size: 11px;
  font-weight: 600;
  color: rgb(48, 49, 51);
  margin: 8px;
  opacity: 0.5;
  cursor: pointer;
}

.viewing-mode-description {
  font-size: 12px;
  color: rgb(48, 49, 51);
  text-align: left;
  padding-bottom: 4px;
  margin-left: 8px;
}

:deep(.maplibregl-ctrl-minimap) {
  transform-origin: top right;
  @media (max-width: 1250px) {
    height: 125px !important; // important is needed here as we are over-riding the style set by the flatmap
    width: 180px !important;
    :deep(.maplibregl-canvas .maplibregl-canvas) {
      height: 125px !important;
      width: 180px !important;
    }
  }
  @media (min-width: 1251px) {
    height: 190px !important;
    width: 300px !important;
    :deep(.maplibregl-canvas .maplibregl-canvas) {
      height: 190px !important;
      width: 300px !important;
    }
  }
  transition: all var(--el-transition-duration);
  &.shrink {
    transform: scale(0.5);
    transform: scale(0.5);
  }
}

.minimap-resize {
  position: absolute;
  pointer-events: all;
  cursor: pointer;
  top: 0;
  right: 0;
  padding-top: 3px; // needed as icon is offset
  width: 20px;
  height: 14px;
  z-index: 9;
  transition: all var(--el-transition-duration);
  &.shrink {
    transform: rotate(0deg);
  }
  &.enlarge {
    transform: rotate(180deg) scale(2);
    padding-bottom: 5px; // note padding is added to the opposite side since it is rotated
    padding-left: 5px;
  }
}

:deep(.flatmap-popper.el-popper) {
  padding: 6px 4px;
  font-size: 12px;
  color: rgb(48, 49, 51);
  background-color: #f3ecf6;
  border: 1px solid $app-primary-color;
  white-space: nowrap;
  min-width: unset;
  &.warning-popper {
    min-width: 150px;
    max-width: 400px;
    word-break: keep-all;
    white-space: unset;
  }
  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
      background-color: #f3ecf6;
    }
  }
}

:deep(.flatmap-popper.flatmap-marker-popper) {
  white-space: break-spaces;
  word-wrap: break-word;
  word-break: break-word;
}

:deep(.el-loading-spinner) {
  .path {
    stroke: $app-primary-color;
  }
  .el-loading-text {
    color: $app-primary-color;
  }
}

:deep(.flatmap-popup-popper) {
  .maplibregl-popup-tip {
    margin-bottom: -1px;
    border-bottom-color: $app-primary-color;
    position: relative;

    &::before {
      content: "";
      display: block;
      width: 0;
      height: 0;
      border: 10px solid transparent;
      border-bottom-color: #f3ecf6;
      position: absolute;
      top: -9px;
      left: -10px;
    }
  }
  .maplibregl-popup-content {
    padding: 6px 4px;
    font-size: 12px;
    color: rgb(48, 49, 51);
    background-color: #f3ecf6;
    border: 1px solid $app-primary-color;
    white-space: nowrap;
    min-width: unset;
    .maplibregl-popup-close-button {
      display: none;
    }
  }
}

:deep(.maplibregl-popup-content) {
  padding: 0px;
}

.bottom-right-control {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 10;
}

:deep(.my-drawer) {
  background: rgba(0, 0, 0, 0);
  box-shadow: none;
}

.drawer {
  :deep(.el-drawer:focus) {
    outline: none;
  }
}

.drawer-button {
  z-index: 8;
  width: 20px;
  height: 40px;
  border: solid 1px $app-primary-color;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  pointer-events: auto;
  background-color: #f9f2fc;

  i {
    font-weight: 600;
    margin-top: 12px;
    color: $app-primary-color;
  }
  &.open {
    i {
      transform: rotate(0deg) scaleY(2);
    }
  }
  &.close {
    transform: translateX(22px); // button + border width
    i {
      transform: rotate(180deg) scaleY(2);
    }
  }
}

:deep(.maplibregl-canvas-container) {
  canvas {
    outline: none;
  }
}

.backgroundSpacer {
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 10px;
}

.flatmap-radio {
  :deep(label) {
    margin-right: 20px;
    &:last-child {
      margin-right: 0px;
    }
  }
  :deep(.el-radio__input) {
    &.is-checked {
      & + .el-radio__label {
        color: $app-primary-color;
      }
      .el-radio__inner {
        border-color: $app-primary-color;
        background: $app-primary-color;
      }
    }
    .el-radio__inner:hover {
      border-color: $app-primary-color;
    }
  }
}

:deep(.custom-popup) {
  .maplibregl-popup-content {
    font-family: 'Asap', sans-serif;
    font-size: 12pt;
    color: $app-primary-color;
    padding-right: 6px;
    padding-top: 6px;
    .maplibregl-popup-close-button {
      display: none;
    }
  }
}

.select-box {
  border-radius: 4px;
  border: 1px solid rgb(144, 147, 153);
  background-color: var(--white);
  font-weight: 500;
  color: rgb(48, 49, 51);
  width: 150px!important;
}

:deep(.flatmap_dropdown) {
  min-width: 160px !important;
  .el-select-dropdown__item {
    white-space: nowrap;
    text-align: left;
    &.is-selected {
      color: $app-primary-color;
      font-weight: normal;
    }
  }
}
.treeControls {
  text-align: left;
  overflow: none;
  padding-top: 7px;
  padding-bottom: 16px;
  background: #ffffff;
}
</style>

<style lang="scss">

.flatmap-container {
  --el-color-primary: #8300BF;
  --el-color-primary-light-5: #CD99E5;
  --el-color-primary-light-9: #F3E6F9;
  --el-color-primary-dark-2: var(--el-color-primary);
}

.flatmap-teleport-popper {
  &.flatmap-popper.el-popper {
    padding: 6px 4px;
    font-family: Asap, sans-serif;
    font-size: 12px;
    color: rgb(48, 49, 51);
    background-color: #f3ecf6;
    border: 1px solid $app-primary-color;
    white-space: nowrap;
    min-width: unset;

    .el-popper__arrow {
      &:before {
        border-color: $app-primary-color;
        background-color: #f3ecf6;
      }
    }
  }
}

</style>
