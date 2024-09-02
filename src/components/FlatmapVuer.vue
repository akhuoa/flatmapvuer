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
                v-if="displayWarning"
                @mouseover="showTooltip(7)"
                @mouseout="hideTooltip(7)"
              >
                <el-icon><el-icon-warning-filled /></el-icon>
                <template v-if="isLegacy">
                  <span class="warning-text">Legacy Map</span>
                  <div class="latest-map-text" @click="viewLatestMap">
                    Click here for the latest map
                  </div>
                </template>
                <template v-else>
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
            <b>Neuron Connection mode</b>
            <p>
              You can now view the network of neurons connected to a selected
              neuron. This mode is located in the settings at the bottom right.
              Once discovery mode is on, click on a neuron to see its
              connections.
            </p>
            <b>Now can display up to 6 panes</b>
            <p>
              You can now display up to 6 panes in the flatmap. This allows you
              to compare between different datasets and/or different views of
              the same dataset.
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
        v-if="viewingMode === 'Annotation' && userInformation && !disableUI"
        :mapCanvas="{
          containerHTML: this.$el,
          class: '.maplibregl-canvas',
        }"
        :toolbarOptions="toolbarOptions"
        :drawnType="drawnType"
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
            v-show="!(disableUI || isCentreLine)"
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
                v-if="containsAlert && alertOptions"
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
                @changed="pathwaysSelected"
                @selections-data-changed="onSelectionsDataChanged"
                @checkAll="checkAllPathways"
                ref="pathwaysSelection"
                key="pathwaysSelection"
              />
              <selections-group
                v-if="taxonConnectivity && taxonConnectivity.length > 0"
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
              <selections-group
                v-if="!(isCentreLine || isFC)  && centreLines && centreLines.length > 0"
                title="Nerves"
                labelKey="label"
                identifierKey="key"
                :selections="centreLines"
                @changed="centreLinesSelected"
                @selections-data-changed="onSelectionsDataChanged"
                ref="centrelinesSelection"
                key="centrelinesSelection"
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
          <el-button type="primary" plain
            @click="/**
             * This event is emitted when the user chooses a different map option
             * from ``openMapOptions`` props.
             * @arg mapOption.key
            * */
            $emit('open-map', item.key)"
          >
            {{ item.display }}
          </el-button>
        </el-row>
      </el-popover>
      <el-popover
        ref="backgroundPopover"
        :virtual-ref="backgroundIconRef"
        placement="top-start"
        width="330"
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
              {{ viewingModes[viewingMode] }}
            </el-row>
          </el-row>
          <template v-if="viewingMode === 'Annotation' && userInformation">
            <el-row class="backgroundSpacer"></el-row>
            <el-row class="backgroundText">Drawn By*</el-row>
            <el-row class="backgroundControl">
              <el-select
                :teleported="false"
                v-model="drawnType"
                placeholder="Select"
                class="select-box annotationSelector"
                popper-class="flatmap_dropdown"
                @change="setDrawnType"
              >
                <el-option
                  v-for="item in drawnTypes"
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
            <el-row class="backgroundSpacer"></el-row>
            <el-row class="backgroundText">Annotated By*</el-row>
            <el-row class="backgroundControl">
              <el-select
                :teleported="false"
                v-model="annotatedType"
                placeholder="Select"
                class="select-box annotationSelector"
                popper-class="flatmap_dropdown"
                @change="setAnnotatedType"
              >
                <el-option
                  v-for="item in annotatedTypes"
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
          <el-row class="backgroundSpacer" v-if="viewingMode === 'Exploration' && !isFC"></el-row>
          <el-row class="backgroundText" v-if="viewingMode === 'Exploration' && !isFC">Markers display</el-row>
          <el-row class="backgroundControl" v-if="viewingMode === 'Exploration' && !isFC">
            <el-col :span="14">
              <el-radio-group
                v-model="imageRadio"
                class="flatmap-radio"
                @change="setImage"
              >
                <el-radio :label="false">Standard</el-radio>
                <el-radio :label="true">Image</el-radio>
              </el-radio-group>
            </el-col>
            <el-col :span="10" v-if="imageRadio">
              <el-select
                :teleported="false"
                v-model="imageType"
                placeholder="Select"
                class="select-box imageSelector"
                popper-class="flatmap_dropdown"
                @change="setImageType"
              >
                <el-option
                  v-for="item in imageTypes"
                  :key="item"
                  :label="item"
                  :value="item"
                >
                  <el-row>
                    <el-col :span="12">{{ item }}</el-col>
                  </el-row>
                </el-option>
              </el-select>
            </el-col>
          </el-row>
          <el-row class="backgroundSpacer" v-if="displayFlightPathOption"></el-row>
          <el-row class="backgroundText" v-if="displayFlightPathOption">Flight path display</el-row>
          <el-row class="backgroundControl" v-if="displayFlightPathOption">
            <el-radio-group
              v-model="flightPath3DRadio"
              class="flatmap-radio"
              @change="setFlightPath3D"
            >
            <el-radio :label="false">2D</el-radio>
            <el-radio :label="true">3D</el-radio>
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
              <el-radio :label="true">Colour</el-radio>
              <el-radio :label="false">Greyscale</el-radio>
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
              <el-radio :label="true">Show</el-radio>
              <el-radio :label="false">Hide</el-radio>
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
        <el-row>
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
        <el-row>
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
        v-show="tooltipDisplay"
        :tooltipType="tooltipType"
        :provenanceEntry="provenanceEntry"
        :annotationEntry="annotationEntry"
        :imageEntry="imageEntry"
        @annotation="commitAnnotationEvent"
      />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { shallowRef, markRaw } from 'vue'
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
  findTaxonomyLabel,
} from '../services/flatmapQueries.js'
import yellowstar from '../icons/yellowstar'
import ResizeSensor from 'css-element-queries/src/ResizeSensor'
import * as flatmap from '@abi-software/flatmap-viewer'
import { AnnotationService } from '@abi-software/sparc-annotation'
import { mapState, mapStores } from 'pinia'
import { useMainStore } from '@/stores/index'
import { useSettingsStore } from '@/stores/settings'
import { DrawToolbar, Tooltip, TreeControls } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'
import {
  getBiolucidaThumbnails,
  getSegmentationThumbnails,
  getScaffoldThumbnails,
  getPlotThumbnails
} from '../services/scicrunchQueries'
import imageMixin from '../mixins/imageMixin'

const centroid = (geometry) => {
  let featureGeometry = { lng: 0, lat: 0, }
  let coordinates
  if (geometry.type === "Polygon") {
    coordinates = geometry.coordinates[0]
  } else {
    coordinates = geometry.coordinates
  }
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

const processSystems = (systems) => {
  const allSystems = []
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

    allSystems.push(data)
  }

  return allSystems
}

const createUnfilledTooltipData = function () {
  return {
    destinations: [],
    origins: [],
    components: [],
    destinationsWithDatasets: [],
    originsWithDatasets: [],
    componentsWithDatasets: [],
    resource: undefined,
  }
}

/**
 * A vue component of the flatmap viewer.
 */
export default {
  name: 'FlatmapVuer',
  mixins:[imageMixin],
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
    const annotator = markRaw(new AnnotationService(`${props.flatmapAPI}annotator`));
    return { annotator }
  },
  methods: {
    /**
     * @vuese
     * Function to add image thumbnails to the map.
     */
    populateImageThumbnails: async function (type) {
      if (this.mapImp) {
        this.closeTooltip()
        this.mapImp.clearMarkers();
        const identifiers = this.mapImp.anatomicalIdentifiers
        const imageThumbnails = this.settingsStore.getImageThumbnails(type, identifiers)
        this.populateMapWithImages(this.mapImp, imageThumbnails, type)
      }
    },
    /**
     * @vuese
     * Function to fetching image thumbnails.
     */
    fetchImageThumbnails: async function (type) {
      let thumbnails = {}
      const organCuries = this.settingsStore.organCuries
      if (type === 'Image') {
        thumbnails = await getBiolucidaThumbnails(this.sparcAPI, organCuries, type)
      } else if (type === 'Segmentation') {
        thumbnails = await getSegmentationThumbnails(this.sparcAPI, organCuries, type)
      } else if (type === 'Scaffold') {
        thumbnails = await getScaffoldThumbnails(this.sparcAPI, organCuries, type)
      } else if (type === 'Plot') {
        thumbnails = await getPlotThumbnails(this.sparcAPI, organCuries, type)
      }
      this.settingsStore.updateImageThumbnails(type, thumbnails)
    },
    /**
     * @vuese
     * Function to switch the type of displayed image.
     * @arg type
     */
    setImageType: async function (type) {
      this.imageType = type
      if (this.mapImp) {
        if (!this.settingsStore.imageTypeCached(type)) {
          this.loading = true
          await this.fetchImageThumbnails(type)
          this.loading = false
        }
        this.populateImageThumbnails(type)
      }
    },
    /**
     * @vuese
     * Function to switch show or hide images.
     * @arg flag
     */
    setImage: function (flag) {
      this.imageRadio = flag
      if (this.mapImp) {
        if (flag) {
          this.setImageType(this.imageType)
        } else {
          this.mapImp.clearMarkers();
        }
        this.$emit('imageThumbnailDisplay', flag)
      }
    },
    /**
     * @vuese
     * Function to initialise drawing.
     */
    initialiseDrawing: function () {
      this.connectionEntry = {}
      this.activeDrawTool = undefined
      this.activeDrawMode = undefined
      this.drawnCreatedEvent = {}
    },
    /**
     * @vuese
     * Function to cancel a newly drawn feature.
     */
    cancelDrawnFeature: function () {
      if (this.isValidDrawnCreated) {
        this.closeTooltip()
        this.annotationEntry = {
          ...this.drawnCreatedEvent.feature,
          resourceId: this.serverURL,
        }
        this.rollbackAnnotationEvent()
        this.initialiseDrawing()
      }
    },
    /**
     * @vuese
     * Function to display connected features' tooltip for drawn connectivity.
     * @arg id
     */
    connectedFeatureTooltip: function (value) {
      if (this.mapImp) {
        if (value) {
          const numericId = Number(value)
          let payload = { feature: {} }
          if (numericId) {
            const data = this.mapImp.featureProperties(numericId)
            payload.feature = data
          } else {
            const drawnFeature = this.existDrawnFeatures.find(
              (feature) => feature.id === value.replace(' ', '')
            )
            payload.feature.feature = drawnFeature
          }
          this.checkAndCreatePopups(payload)
        } else {
          this.closeTooltip()
        }
      }
    },
    /**
     * @vuese
     * Function to confirm a newly drawn feature.
     */
    confirmDrawnFeature: function () {
      if (this.isValidDrawnCreated) {
        this.checkAndCreatePopups(this.drawnCreatedEvent)
        // Add connection if exist to annotationEntry
        // Connection will only be added in creating new drawn feature annotation
        // And will not be updated if move drawn features
        if (Object.keys(this.connectionEntry).length > 0) {
          this.annotationEntry.feature.connection = this.connectionEntry
        }
        this.initialiseDrawing()
      }
    },
    /**
     * @vuese
     * Function to process the annotation toolbar click events.
     * @arg type
     */
    toolbarEvent: function (type, name) {
      this.closeTooltip()
      this.doubleClickedFeature = false
      this.connectionEntry = {}
      if (type === 'mode') {
        // Deselect any feature when draw mode is changed
        this.changeAnnotationDrawMode({ mode: 'simple_select' })
        this.activeDrawMode = name
        // rollback modified feature when exit edit/delete mode
        if (Object.keys(this.annotationEntry).length > 0 && !this.featureAnnotationSubmitted) {
          this.rollbackAnnotationEvent()
        }
      } else if (type === 'tool') {
        if (name) {
          const tool = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
          this.changeAnnotationDrawMode({ mode: `draw${tool}` })
          this.initialiseDrawing()
        } else {
          this.changeAnnotationDrawMode({ mode: 'simple_select' })
          this.cancelDrawnFeature()
        }
        this.activeDrawTool = name
      }
    },
    /**
     * @vuese
     * Function to fire annotation event based on the provided ``data``.
     * Either edit or delete action.
     * @arg data
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
      }
      if (this.activeDrawMode === 'Delete') {
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
        this.annotationEntry.body = body
      }
    },
    /**
     * @vuese
     * Function to update the annotation draw mode.
     * @arg mode
     */
    changeAnnotationDrawMode: function (mode) {
      if (this.mapImp) {
        this.mapImp.changeAnnotationDrawMode(mode)
      }
    },
    /**
     * @vuese
     * Function to remove all drawn annotations from flatmap annotation layer.
     */
    clearAnnotationFeature: function () {
      if (
        this.mapImp &&
        this.existDrawnFeatures.length > 0
      ) {
        this.mapImp.clearAnnotationFeature()
      }
    },
    /**
     * @vuese
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
     * @vuese
     * Function to rollback the failure drawn from flatmap annotation layer.
     */
    rollbackAnnotationEvent: function () {
      // For 'updated' and 'deleted' callback
      if (
        this.mapImp &&
        ['created', 'updated', 'deleted'].includes(this.annotationEntry.type)
      ) {
        this.mapImp.rollbackAnnotationEvent(this.annotationEntry)
        this.annotationEntry = {}
      }
    },
    /**
     * @vuese
     * Function to commit the emitted ``annotation`` data from successful new drawn to flatmap annotation layer.
     * @arg annotation
     */
    commitAnnotationEvent: function (annotation) {
      if (
        this.mapImp &&
        ['created', 'updated', 'deleted'].includes(this.annotationEntry.type) &&
        // Only when annotation comments stored successfully
        annotation
      ) {
        this.featureAnnotationSubmitted = true
        this.mapImp.commitAnnotationEvent(this.annotationEntry)
        if (this.annotationEntry.type === 'deleted') {
          this.closeTooltip()
          this.annotationEntry = {}
        } else {
          // Update 'existDrawnFeatures' when created or updated event
          this.addAnnotationFeature()
        }
      }
    },
    /**
     * @vuese
     * Function to fetch annotated item id.
     * @arg userId,
     * @arg participated
     */
    fetchAnnotatedItemIds: async function (userId = undefined, participated = undefined) {
      let annotatedItemIds = await this.annotator.annotatedItemIds(this.userToken, this.serverURL, userId, participated)
      // The annotator has `resource` and `items` fields
      if ('resource' in annotatedItemIds) annotatedItemIds = annotatedItemIds.itemIds
      return annotatedItemIds
    },
    /**
     * @vuese
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
     * @vuese
     * Function to fetch drawn features.
     * @arg userId,
     * @arg participated
     */
    fetchDrawnFeatures: async function (userId, participated) {
      const annotatedItemIds = await this.fetchAnnotatedItemIds(userId, participated)
      let drawnFeatures = await this.annotator.drawnFeatures(this.userToken, this.serverURL, annotatedItemIds)
      // The annotator has `resource` and `features` fields
      if ('resource' in drawnFeatures) drawnFeatures = drawnFeatures.features
      // Use to switch the displayed feature type
      if (this.drawnType !== 'All tools') {
        drawnFeatures = drawnFeatures.filter((feature) => {
          return feature.geometry.type === this.drawnType
        })
      }
      return drawnFeatures
    },
    /**
     * @vuese
     * Function to draw existing drawn annotations based on selector.
     */
    addAnnotationFeature: async function () {
      if (this.mapImp) {
        if (!this.featureAnnotationSubmitted) this.clearAnnotationFeature()
        if (this.drawnType !== 'None') {
          if (!this.featureAnnotationSubmitted) this.loading = true
          const userId = this.annotatedType === 'Anyone' ?
            undefined : this.userInformation.orcid ?
              this.userInformation.orcid : '0000-0000-0000-0000'
          const participated = this.annotatedType === 'Anyone' ?
            undefined : this.annotatedType === 'Me' ?
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
      }
    },
    /**
     * @vuese
     * Function to display annotator toolbar.
     * @arg flag
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
     * @vuese
     * Function to switch the type of annotation.
     * @arg flag
     */
    setDrawnType: function (flag) {
      this.drawnType = flag
      if (this.mapImp) {
        this.addAnnotationFeature()
        this.initialiseDrawing()
      }
    },
    /**
     * @vuese
     * Function to switch the type of person who annotated.
     * @arg flag
     */
    setAnnotatedType: function (flag) {
      this.annotatedType = flag
      if (this.mapImp) {
        this.addAnnotationFeature()
      }
    },
    /**
     * @vuese
     * Function to switch from 2D to 3D
     * @arg flag
     */
    setFlightPath3D: function (flag) {
      this.flightPath3DRadio = flag
      if (this.mapImp) {
        this.mapImp.enableFlightPaths(flag)
      }
    },
    /**
     * @vuese
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
     * @vuese
     * Function to change the background colour of the map
     * by providing the ``colour``.
     * @arg colour
     */
    backgroundChangeCallback: function (colour) {
      this.currentBackground = colour
      if (this.mapImp) {
        this.mapImp.setBackgroundColour(this.currentBackground, 1)
      }
    },
    /**
     * @vuese
     * Function to process a list of a FC flatmap's systems.
     * @arg systems
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
     * @vuese
     * Function to add taxon identifiers into the taxon connectivity array,
     * by retrieving their corresponding labels using the flatmap API.
     * @arg flatmapAPI,
     * @arg taxonIdentifiers
     */
    processTaxon: function (flatmapAPI, taxonIdentifiers) {
      this.taxonConnectivity.length = 0
      taxonIdentifiers.forEach((taxon) => {
        findTaxonomyLabel(flatmapAPI, taxon).then((value) => {
          const item = { taxon, label: value }
          this.taxonConnectivity.push(item)
        })
      })
    },
    /**
     * @vuese
     * Function to show or hide the display of the bottom-left drawer container.
     */
    toggleDrawer: function () {
      this.drawerOpen = !this.drawerOpen
    },
    /**
     * @vuese
     * Function to toggle colour/greyscale of organs.
     * The parameter ``flag`` is a boolean, ``true`` (colour) and ``false`` (greyscale).
     * @arg flag
     */
    setColour: function (flag) {
      this.colourRadio = flag
      if (this.mapImp) {
        this.mapImp.setColour({ colour: flag, outline: this.outlinesRadio })
      }
    },
    /**
     * @vuese
     * Function to toggle outlines f organs.
     * The parameter ``flag`` is a boolean, ``true`` to show outlines, ``false`` to hide outlines.
     * @arg flag
     */
    setOutlines: function (flag) {
      this.outlineRadio = flag
      if (this.mapImp) {
        this.mapImp.setColour({ colour: this.colourRadio, outline: flag })
      }
    },
    /**
     * @vuese
     * Function to toggle paths to default.
     * Also called when the associated button is pressed.
     */
    resetView: function () {
      if (this.mapImp) {
        this.mapImp.resetMap()
        if (this.$refs.centrelinesSelection) {
          this.$refs.centrelinesSelection.reset()
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
     * @vuese
     * Function to zoom in.
     * Also called when the associated button is pressed.
     */
    zoomIn: function () {
      if (this.mapImp) {
        this.mapImp.zoomIn()
      }
    },
    /**
     * @vuese
     * Function to zoom out.
     * Also called when the associated button is pressed.
     */
    zoomOut: function () {
      if (this.mapImp) {
        this.mapImp.zoomOut()
      }
    },
    /**
     * @vuese
     * Function to show or hide centrelines and nodes.
     * The parameter ``payload`` is an object with a boolean property, ``value``,
     * ``payload.value = true/false``.
     * @arg payload
     */
    centreLinesSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableCentrelines(payload.value)
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
     * @vuese
     * Function to highlight the connected paths
     * by providing path model identifier, ``pathId``.
     * @arg pathId
     */
    highlightConnectedPaths: async function (payload) {
      if (this.mapImp) {
        let paths = [...this.mapImp.pathModelNodes(payload)]

        // The line below is to get the path features from the geojson ids
        let pathFeatures = paths.map((p) => this.mapImp.featureProperties(p))

        // Query the flatmap knowledge graph for connectivity, we use this to grab the origins
        let connectivity = await this.flatmapQueries.queryForConnectivity(payload)

        // Check and flatten the origins node graph
        let originsFlat = connectivity?.ids?.dendrites?.flat().flat()

        let toHighlight = []
        let highlight = false

        // Loop through the path features and check if we have origin nodes
        pathFeatures.forEach((p) => {

          // Get the nodes from each path feature
          this.mapImp.nodePathModels(p.featureId).forEach((f) => {
            highlight = true
            // s2 here is the second level paths
            let s2 = this.mapImp.pathModelNodes(f)
            s2.forEach((s) => {
              let s2Feature = this.mapImp.featureProperties([s]) // get the feature properties for s2
              if (originsFlat.includes(s2Feature.models)) {
                highlight = false // if we have an origin node, we don't want to highlight the path
                return
              }
            })

            if (highlight) {
              toHighlight.push(f)
            }
          })
        })

        // display connected paths
        this.mapImp.zoomToFeatures(toHighlight, { noZoomIn: true })
      }
    },
    resetMapFilter: function() {
      const alert = this.mapFilters.alert;
      let filter = undefined;
      if (alert.with) {
        if (!alert.without) {
          filter = {
            HAS: 'alert',
          };
        }
      } else {
        if (alert.without) {
          filter = {
            NOT: { HAS: 'alert'},
          };
        } else {
          filter = {
            AND: [ {NOT: { HAS: 'alert'}}, { HAS: 'alert'}]
          }
        }
      }
      if (filter) {
        this.mapImp.setVisibilityFilter(filter)
      } else {
        this.mapImp.clearVisibilityFilter()
      }
    },
    /**
     * @vuese
     * Function to enable/disable mouse enter and leave event for
     * alert checkbox
     * @arg payload
     */
    alertMouseEnterEmitted: function (payload) {
      if (this.mapImp) {
        if (payload.value) {
          let filter = undefined;
          if (payload.key === "alert") {
            filter = {
              HAS: 'alert',
            }
          } else if (payload.key === "withoutAlert") {
            filter = {
              NOT: {HAS: 'alert'},
            }
          }
          this.mapImp.setVisibilityFilter(filter)
        } else {
          this.resetMapFilter()
        }
      }
    },
    /**
     * @vuese
     * Function to enable/disable (show/hide) pathways with/without alert
     * by providing ``kay, value`` ``payload`` object ``{alertKey, true/false}``.
     * @arg payload
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
     * @vuese
     * Function to enable/disable (show/hide) all alerts
     * option by providing ``flag`` (true/false).
     * @arg flag
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
     * @vuese
     * Function to enable/disable (show/hide) the system
     * by providing ``kay, value`` ``payload`` object ``{systemId, true/false}``.
     * @arg payload
     */
    systemSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableSystem(payload.key, payload.value)
      }
    },
    /**
     * @vuese
     * Function to enable/disable (show/hide) all systems
     * by providing ``flag`` (true/false).
     * @arg flag
     */
    checkAllSystems: function (flag) {
      if (this.mapImp) {
        this.systems[0].children.forEach((key) =>
          this.mapImp.enableSystem(key.label, flag)
        )
      }
    },
    /**
     * @vuese
     * Function to display features with annotation matching the provided term.
     * @arg models
     */
    ftuSelected: function (models) {
      this.searchAndShowResult(models, true)
    },
    /**
     * @vuese
     * Function to show or hide the layer
     * by providing ``{layerId, true/false}`` in ``payload``.
     * @arg payload
     */
    layersSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableLayer(payload.key, payload.value)
      }
    },
    /**
     * @vuese
     * Function to show or hide all layers
     * by providing ``payload`` with ``payload.keys`` array and ``payload.value`` flag.
     * @arg payload
     */
    checkAllLayers: function (payload) {
      if (this.mapImp) {
        payload.keys.forEach((key) =>
          this.mapImp.enableLayer(key, payload.value)
        )
      }
    },
    /**
     * @vuese
     * Function to show or hide connectivity features studied in particular species
     * by providing ``{taxonId, true/false}`` in ``payload.key, payload.value``.
     * @arg payload
     */
    taxonsSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enableConnectivityByTaxonIds(payload.key, payload.value)
      }
    },
    taxonMouseEnterEmitted: function (payload) {
      if (this.mapImp) {
        if (payload.value) {
          let gid = this.mapImp.taxonFeatureIds(payload.key)
          this.mapImp.enableConnectivityByTaxonIds(payload.key, payload.value) // make sure path is visible
          this.mapImp.zoomToGeoJSONFeatures(gid, {noZoomIn: true})
        } else {
          // reset visibility of paths
          this.mapImp.unselectGeoJSONFeatures()
          payload.selections.forEach((item) => {
            let show = payload.checked.includes(item.taxon)
            this.mapImp.enableConnectivityByTaxonIds(item.taxon, show)
          })
        }
      }
    },
    /**
     * @vuese
     * Function to show or hide connectivity features studied in particular species
     * by providing ``payload`` with ``payload.keys`` array and ``payload.value`` flag.
     * @arg payload
     */
    checkAllTaxons: function (payload) {
      if (this.mapImp) {
        payload.keys.forEach((key) =>
          this.mapImp.enableConnectivityByTaxonIds(key, payload.value)
        )
      }
    },
    /**
     * @vuese
     * Function to hide or show paths of a given type
     * by providing ``{pathType, true/false}`` in ``payload.key, payload.value``.
     * @arg payload
     */
    pathwaysSelected: function (payload) {
      if (this.mapImp) {
        this.mapImp.enablePath(payload.key, payload.value)
      }
    },
    /**
     * @vuese
     * Function to hide or show paths of a given type
     * by providing ``payload`` with ``payload.keys`` array and ``payload.value`` flag.
     * @arg payload
     */
    checkAllPathways: function (payload) {
      if (this.mapImp) {
        payload.keys.forEach((key) =>
          this.mapImp.enablePath(key, payload.value)
        )
      }
    },
    /**
     * @vuese
     * Function to generate callbacks as a result of panning/zooming the map.
     * ``flag`` (boolean) - generate callbacks when ``true``, otherwise disable them.
     * @arg flag
     */
    enablePanZoomEvents: function (flag) {
      this.mapImp.enablePanZoomEvents(flag)
    },
    /**
     * @vuese
     * Function to process annotation callbacks, invoked when events occur with the map.
     * @arg payload,
     * @arg data
     */
    annotationEventCallback: function (payload, data) {
      // Popup closed will trigger aborted event this is used to control the tooltip
      if (data.type === 'aborted') {
        // Rollback drawing when no new annotation submitted
        if (!this.featureAnnotationSubmitted) this.rollbackAnnotationEvent()
        else this.featureAnnotationSubmitted = false
      } else if (data.type === 'modeChanged') {
        if (data.feature.mode === 'direct_select') this.doubleClickedFeature = true
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
        else this.checkAndCreatePopups(payload)
      }
    },
    /**
     * @vuese
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
            let taxons = undefined
            if (data.taxons) {
              // check if data.taxons is string or array
              if (typeof data.taxons !== 'object') {
                taxons = JSON.parse(data.taxons)
              } else {
                taxons = data.taxons
              }
            }
            const payload = {
              dataset: data.dataset,
              biologicalSex: biologicalSex,
              taxonomy: taxonomy,
              resource: resource,
              label: label,
              feature: data,
              userData: args,
              eventType: eventType,
              provenanceTaxonomy: taxons,
              markerType: this.imageRadio ? this.imageType : "Standard",
            }
            if (eventType === 'click') {
              this.featuresAlert = data.alert
              if (this.viewingMode === 'Neuron Connection') {
                this.highlightConnectedPaths([data.models])
              } else {
                this.currentActive = data.models ? data.models : ''
                // Drawing connectivity between features
                if (this.activeDrawTool && !this.isValidDrawnCreated) {
                  // Check if flatmap features or existing drawn features
                  const validDrawnFeature = data.featureId || this.existDrawnFeatures.find(
                    (feature) => feature.id === data.id
                  )
                  // Only the linestring will have connection
                  if (this.activeDrawTool === 'LineString' && validDrawnFeature) {
                    const key = data.featureId ? data.featureId : data.id
                    const nodeLabel = data.label ? data.label : `Feature ${data.id}`
                    // Add space before key to make sure properties follows adding order
                    this.connectionEntry[` ${key}`] = Object.assign({ label: nodeLabel },
                      Object.fromEntries(
                        Object.entries(data)
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
              eventType === 'click' &&
              !(this.viewingMode === 'Neuron Connection') &&
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
     * @vuese
     * Function triggered by viewing mode change.
     * (e.g., from 'Exploration' to 'Annotation')
     * All tooltips and popups currently showing on map will be closed
     */
    changeViewingMode: function (modeName) {
      if (modeName) {
        this.viewingMode = modeName
      }
      this.closeTooltip()
    },
    /**
     * @vuese
     * Function to create/display tooltips from the provided ``data``.
     * _checkNeuronClicked shows a neuron path pop up if a path was recently clicked._
     * @arg data
     */
    checkAndCreatePopups: async function (data) {
      this.imageEntry = []
      this.provenanceEntry = {}
      if (data.feature.type === 'marker' && this.imageRadio) {
        this.tooltipType = 'image'
        const imageThumbnails = this.settingsStore.getImageThumbnails(this.imageType, [data.resource[0]])
        if (data.resource[0] in imageThumbnails) {
          this.imageEntry = markRaw(imageThumbnails[data.resource[0]])
        }
        this.displayTooltip(data.feature.models)
      } else {
      // Call flatmap database to get the connection data
      if (this.viewingMode === 'Annotation') {
        if (data.feature) {
          this.annotationEntry = {
            ...data.feature,
            resourceId: this.serverURL,
          }
          this.tooltipType = 'annotation'
          if (data.feature.featureId && data.feature.models) {
            this.displayTooltip(data.feature.models)
          } else if (data.feature.feature) {
            // in drawing or edit/delete mode is on or has connectivity
            if (
              this.activeDrawTool ||
              this.activeDrawMode ||
              Object.keys(this.connectionEntry).length > 0
            ) {
              this.featureAnnotationSubmitted = false
              this.annotationEntry.featureId = data.feature.feature.id
              if (this.activeDrawTool) this.createConnectivityBody()
              this.displayTooltip(
                data.feature.feature.id,
                centroid(data.feature.feature.geometry)
              )
            } else {
              this.rollbackAnnotationEvent()
            }
          }
        } else {
          this.annotation = {}
        }
      } else {
        let results =
          await this.flatmapQueries.retrieveFlatmapKnowledgeForEvent(data)
        // The line below only creates the tooltip if some data was found on the path
        // result 0 is the connection, result 1 is the pubmed results from flatmap
        if (
          results[0] ||
          results[1] ||
          (data.feature.hyperlinks && data.feature.hyperlinks.length > 0)
        ) {
          this.tooltipType = 'provenance'
          this.resourceForTooltip = data.resource[0]
          data.resourceForTooltip = this.resourceForTooltip
          this.createTooltipFromNeuronCuration(data)
          }
        }
      }
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
     * @vuese
     * Function to close tooltip.
     */
    closeTooltip: function () {
      this.$refs.tooltip.$el.style.display = 'none'
      document.querySelectorAll('.maplibregl-popup').forEach((item) => {
        item.style.display = 'none'
      })
    },
    /**
     * @vuese
     * Function to create tooltip from Neuron Curation ``data``.
     * @arg data
     */
    createTooltipFromNeuronCuration: async function (data) {
      this.provenanceEntry = await this.flatmapQueries.createTooltipData(data)
      this.displayTooltip(data.resource[0])
    },
    /**
     * @vuese
     * Function to show popup on map.
     * @arg featureId,
     * @arg node,
     * @arg options
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
     * @vuese
     * Function to show marker popup.
     * @arg featureId,
     * @arg node,
     * @arg options
     */
    showMarkerPopup: function (featureId, node, options) {
      if (this.mapImp) {
        this.mapImp.showMarkerPopup(featureId, node, options)
      }
    },
    /**
     * @vuese
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
     * @vuese
     * Function to set help mode
     * by providing flag ``helpMode`` (true/false).
     * @arg helpMode
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
            this.drawerOpen = true;
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
     * @vuese
     * Function to show tooltip
     * by providing ``tooltipNumber``.
     * @arg tooltipNumber
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
     * @vuese
     * Function to hide tooltip
     * by providing ``tooltipNumber``.
     * @arg tooltipNumber
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
     * @vuese
     * Function to display tooltip
     * by providing featureId (``feature``).
     * @arg feature
     */
    displayTooltip: function (feature, geometry = undefined) {
      let featureId = undefined
      let options = { className: 'flatmapvuer-popover' }
      if (geometry) {
        featureId = feature
        options.annotationFeatureGeometry = geometry
      } else {
        featureId = this.mapImp.modelFeatureIds(feature)[0]
        if (!this.activeDrawTool && !this.imageEntry.length) {
          options.positionAtLastClick = true
        }
      }
      // If connectivityInfoSidebar is set to `true`
      // Connectivity info will show in sidebar
      if ((this.connectivityInfoSidebar && this.hasTooltipEntry()) && this.viewingMode !== 'Annotation') {
        // move the map center to highlighted area
        // this method is moved to sidebar connectivity info
        // const featureIds = [feature];
        // this.moveMap(featureIds);
        if (this.featuresAlert) {
          this.provenanceEntry['featuresAlert'] = this.featuresAlert;
        }
        this.$emit('connectivity-info-open', this.provenanceEntry);
      }
      if (this.imageThumbnailSidebar && this.viewingMode === 'Exploration') {
        this.$emit('image-thumbnail-open', this.imageEntry)
      }
      // If UI is not disabled,
      // And connectivityInfoSidebar is not set (default) or set to `false`
      // Provenance popup will be shown on map
      // Tooltip will be shown for Annotation view
      if (
        !this.disableUI && (
          this.viewingMode === 'Annotation' ||
          (
            this.viewingMode === 'Exploration' &&
            (
              (!this.connectivityInfoSidebar && this.hasTooltipEntry()) ||
              (!this.imageThumbnailSidebar && this.imageEntry.length)
            )
          )
        )
      ) {
        this.tooltipDisplay = true;
        this.$nextTick(() => {
          this.mapImp.showPopup(featureId, this.$refs.tooltip.$el, options);
          this.popUpCssHacks();
        });

      }
    },
    hasTooltipEntry: function () {
      const {
        components,
        destinations,
        origins,
        provenanceTaxonomy,
        provenanceTaxonomyLabel
      } = this.provenanceEntry;

      return Boolean(
        components?.length ||
        destinations?.length ||
        origins?.length ||
        provenanceTaxonomy?.length ||
        provenanceTaxonomyLabel?.length
      );
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
        const Map = this.mapImp._map;
        const bbox = this.mapImp._bounds.toArray();

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
     * @vuese
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
     * @vuese
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
     * @vuese
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
     * @vuese
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
        return state
      }
      return undefined
    },
    /**
     * @vuese
     * Function to set state (object) for the map.
     * @arg state
     */
    setState: function (state) {
      if (state) {
        if (
          this.mapImp &&
          state.entry &&
          this.entry == state.entry &&
          (!state.biologicalSex || state.biologicalSex === this.biologicalSex)
        ) {
          if (state.viewport) {
            this.mapImp.setState(state.viewport)
          }
        } else {
          this.createFlatmap(state)
        }
        this.setStateRequired = false
      }
    },
    /**
     * @vuese
     * Function to restore map's state
     * from the ``state`` provided.
     * @arg state
     */
    restoreMapState: function (state) {
      if (state) {
        if (state.viewport) this.mapImp.setState(state.viewport)
        if (state.searchTerm) this.searchAndShowResult(state.searchTerm, true)
      }
    },
    /**
     * @vuese
     * Function to show flight path option
     * (3D option)
     * based on the map version (currently 1.6 and above).
     * @arg mapVersion
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
     * @vuese
     * Function to create Flatmap
     * by providing the ``state``.
     * @arg state
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
            if (state.biologicalSex) {
              identifier['biologicalSex'] = state.biologicalSex
            } else if (identifier.taxon === 'NCBITaxon:9606') {
              //For backward compatibility
              identifier['biologicalSex'] = 'PATO:0000384'
            }
          }
        } else {
          // Set the bioloicalSex now if map is not resumed from
          // a saved state
          if (this.biologicalSex) {
            identifier['biologicalSex'] = this.biologicalSex
          }
        }

        let promise1 = this.mapManager.loadMap(
          identifier,
          this.$refs.display,
          this.eventCallback(),
          {
            //fullscreenControl: false,
            //annotatable: false,
            //debug: true,
            minZoom: this.minZoom,
            tooltips: this.tooltips,
            minimap: minimap,
            // tooltipDelay: 15, // new feature to delay tooltips showing
          }
        )
        promise1.then((returnedObject) => {
          this.mapImp = returnedObject
          this.serverURL = this.mapImp.makeServerUrl('').slice(0, -1)
          let mapVersion = this.mapImp.details.version
          this.setFlightPathInfo(mapVersion)
          this.onFlatmapReady()
          if (this._stateToBeSet) this.restoreMapState(this._stateToBeSet)
          else {
            this.restoreMapState(state)
          }
        })
      } else if (state) {
        this._stateToBeSet = {
          viewport: state.viewport,
          searchTerm: state.searchTerm,
        }
        if (this.mapImp && !this.loading)
          this.restoreMapState(this._stateToBeSet)
      }
    },
    /**
     * @vuese
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
     * @vuese
     * Function to resize the map.
     */
    mapResize: function () {
      try {
        this.computePathControlsMaximumHeight()
        if (this.mapImp) {
          this.mapImp.resize()
          this.showMinimap(this.displayMinimap)
          if (this.mapImp._minimap) {
            this.mapImp._minimap._miniMap.resize()
          }
        }
      } catch {
        console.error('Map resize error')
      }
    },
    /**
     * @vuese
     * This function is used for functions that need to run immediately after the flatmap is loaded.
     */
    onFlatmapReady: function () {
      // onFlatmapReady is used for functions that need to run immediately after the flatmap is loaded
      this.sensor = markRaw(new ResizeSensor(this.$refs.display, this.mapResize))
      console.log(this.mapImp.options)
      if (this.mapImp.options?.style === 'functional') {
        this.isFC = true
      } else if (this.mapImp.options?.style === 'centreline') {
        this.isCentreLine = true
      }
      this.mapImp.setBackgroundOpacity(1)
      this.backgroundChangeCallback(this.currentBackground)
      this.pathways = this.mapImp.pathTypes()
      if (!this.isCentreLine) {
        this.mapImp.enableCentrelines(false)
      }
      //Disable layers for now
      //this.layers = this.mapImp.getLayers();
      this.processSystems(this.mapImp.getSystems())
      this.processTaxon(this.flatmapAPI, this.mapImp.taxonIdentifiers)
      this.containsAlert = "alert" in this.mapImp.featureFilterRanges()
      this.addResizeButtonToMinimap()
      this.loading = false
      this.computePathControlsMaximumHeight()
      this.drawerOpen = !this.isCentreLine
      this.mapResize()
      this.handleMapClick()
      /**
       * This is ``onFlatmapReady`` event.
       * @arg ``this`` (Component Vue Instance)
       */
      this.$emit('ready', this)
    },
    /**
     * @vuese
     * Function to handle mouse click on map area
     * after the map is loaded.
     */
    handleMapClick: function () {
      const _map = this.mapImp._map;

      if (_map) {
        _map.on('click', (e) => {
          // Tmeporary add imageEntry length
          if (this.provenanceEntry.featureId || this.imageEntry.length) {
            this.$emit('connectivity-info-close');
          }
        });
      }
    },
    /**
     * @vuese
     * Function to show or hide the minimap
     * by providing ``flag`` (boolean) value.
     * @arg flag
     */
    showMinimap: function (flag) {
      if (this.mapImp) this.mapImp.showMinimap(flag)
    },
    /**
     * @vuese
     * Function to show or hide the pathways drawer
     * by providing ``flag`` (boolean) value.
     * @arg flag
     */
    showPathwaysDrawer: function (flag) {
      this.drawerOpen = flag
    },
    /**
     * @vuese
     * Function to display features with annotation matching the provided term,
     * with the option to display the label using displayLabel flag.
     * @arg term,
     * @arg displayLabel
     */
    searchAndShowResult: function (term, displayLabel) {
      if (this.mapImp) {
        if (term === undefined || term === '') {
          this.mapImp.clearSearchResults()
          return true
        } else {
          const searchResults = this.mapImp.search(term)
          if (
            searchResults &&
            searchResults.results &&
            searchResults.results.length > 0
          ) {
            this.mapImp.showSearchResults(searchResults)
            if (
              displayLabel &&
              searchResults.results[0].featureId &&
              searchResults.results[0].text
            ) {
              const annotation = this.mapImp.annotation(
                searchResults.results[0].featureId
              )
              this.mapImp.showPopup(
                searchResults.results[0].featureId,
                annotation.label,
                {
                  className: 'custom-popup',
                  positionAtLastClick: false,
                  preserveSelection: true,
                }
              )
            }
            return true
          } else this.mapImp.clearSearchResults()
        }
      }
      return false
    },
    /**
     * @vuese
     * Function to show search suggestions
     * from the ``term`` provided.
     * @arg term
     */
    searchSuggestions: function (term) {
      if (this.mapImp) return this.mapImp.search(term)
      return []
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
      default: 4,
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
      default: 'https://api.sparc.science',
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
     * The option to show image thumbnail in sidebar
     */
    imageThumbnailSidebar: {
      type: Boolean,
      default: false,
    },
  },
  provide() {
    return {
      flatmapAPI: this.flatmapAPI,
      $annotator: this.annotator,
      getFeaturesAlert: () => this.featuresAlert,
      userApiKey: this.userToken,
    }
  },
  data: function () {
    return {
      sensor: null,
      mapManager: undefined,
      flatmapQueries: undefined,
      annotationEntry: {},
      //tooltip display has to be set to false until it is rendered
      //for the first time, otherwise it may display an arrow at a
      //undesired location.
      tooltipDisplay: false,
      serverURL: undefined,
      layers: [],
      pathways: [],
      imageEntry: markRaw([]),
      tooltipType: 'provenance',
      sckanDisplay: [
        {
          label: 'Display Path with SCKAN',
          key: 'VALID',
        },
      ],
      centreLines: [
        {
          label: 'Display Nerves',
          key: 'centrelines',
          enabled: false,
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
      isCentreLine: false,
      inHelp: false,
      currentBackground: 'white',
      availableBackground: ['white', 'lightskyblue', 'black'],
      loading: false,
      flatmapMarker: flatmapMarker,
      provenanceEntry: createUnfilledTooltipData(),
      connectivityTooltipVisible: false,
      drawerOpen: false,
      featuresAlert: undefined,
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
        'Annotation': 'View internal identifiers of features'
      },
      drawnType: 'All tools',
      drawnTypes: ['All tools', 'Point', 'LineString', 'Polygon', 'None'],
      annotatedType: 'Anyone',
      annotatedTypes: ['Anyone', 'Me', 'Others'],
      imageRadio: false,
      imageType: 'Image',
      imageTypes: ['Image', 'Segmentation', 'Scaffold', 'Plot'],
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
      userInformation: undefined,
      activeDrawMode: undefined,
      activeDrawTool: undefined,
      featureAnnotationSubmitted: false,
      drawnCreatedEvent: {},
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
    }
  },
  computed: {
    ...mapState(useMainStore, ['userToken']),
    ...mapStores(useSettingsStore),
    isValidDrawnCreated: function () {
      return Object.keys(this.drawnCreatedEvent).length > 0
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
          if (this.mapManager) {
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
      if (mode === 'Annotation') {
        this.loading = true
        this.annotator.authenticate(this.userToken).then((userData) => {
          if (userData.name && userData.email) {
            this.showAnnotator(true)
            this.userInformation = userData
            this.setFeatureAnnotated()
            if (this.existDrawnFeatures.length === 0) {
              this.addAnnotationFeature()
            }
          }
          this.loading = false
        })
      } else this.showAnnotator(false)
    },
    disableUI: function (isUIDisabled) {
      if (isUIDisabled) {
        this.closeTooltip()
      }
    }
  },
  mounted: function () {
    this.openMapRef = shallowRef(this.$refs.openMapRef)
    this.backgroundIconRef = shallowRef(this.$refs.backgroundIconRef)
    this.tooltipWait.length = this.hoverVisibilities.length
    this.mapManager = markRaw(new flatmap.MapManager(this.flatmapAPI))
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
  transition: all var(--el-transition-duration);
  &.open {
    left: 0px;
  }
  &.close {
    left: -298px;
  }
}

.svg-legends-container {
  width: 70%;
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

:deep(.flatmap-tooltip-popup) {
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

.open-drawer,
.drawer-button {
  z-index: 8;
  width: 20px;
  height: 40px;
  border: solid 1px $app-primary-color;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  pointer-events: auto;
}

.open-drawer {
  position: absolute;
  left: 0px;
  background-color: #f7faff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.drawer-button {
  float: left;
  margin-top: calc(50% - 36px);
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
  .maplibregl-popup-tip {
    display: none;
  }
  .maplibregl-popup-content {
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    display: none;
    background: #fff;
    font-family: 'Asap', sans-serif;
    font-size: 12pt;
    color: $app-primary-color;
    border: 1px solid $app-primary-color;
    padding-left: 6px;
    padding-right: 6px;
    padding-top: 6px;
    padding-bottom: 6px;
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
    .maplibregl-popup-close-button {
      display: none;
    }
  }
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
      margin-top: 18px;
      &::after,
      &::before {
        top: calc(-100% + 6px);
        border-width: 12px;
      }
      /* this border color controlls the color of the triangle (what looks like the fill of the triangle) */
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
}

.select-box {
  border-radius: 4px;
  border: 1px solid rgb(144, 147, 153);
  background-color: var(--white);
  font-weight: 500;
  color: rgb(48, 49, 51);
  &.annotationSelector {
    width: 150px!important;
  }
  &.imageSelector {
    width: 125px!important;
  }
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
