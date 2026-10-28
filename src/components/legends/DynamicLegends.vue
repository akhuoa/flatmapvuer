<template>
  <div class="legend-group">
    <div
      class="legend-container"
      v-for="item in legends"
      :key="item[identifierKey]"
      :label="item[identifierKey]"
    >
      <template v-if="item[identifierKey] === 'Featured dataset marker'">
        <el-popover
          content="Location of the featured dataset"
          placement="right"
          :teleported="true"
          trigger="manual"
          width="max-content"
          :offset="0"
          popper-class="flatmap-popper flatmap-teleport-popper"
          :visible="isHovering"
          ref="featuredMarkerPopover"
        >
          <template #reference>
            <div
              v-popover:featuredMarkerPopover
              v-help-mode="{
                id: 'flatmap-featured-marker',
                area: 'legends',
                title: 'Featured dataset marker',
                description: 'Shows the location of the featured dataset on the map.',
                placement: 'right',
                onEnter: openHelpModeDrawer,
              }"
              @mouseover="onMouseOver"
              @mouseout="onMouseOut"
            >
              <LegendItem
                :item="item"
                :identifierKey="identifierKey"
                :styleKey="styleKey"
                :showStarInLegend="showStarInLegend"
              />
            </div>
          </template>
        </el-popover>
      </template>
      <template v-else>
        <LegendItem
          :item="item"
          :identifierKey="identifierKey"
          :styleKey="styleKey"
          :showStarInLegend="showStarInLegend"
        />
      </template>
    </div>
  </div>
</template>

<script>
import LegendItem from './LegendItem.vue';
import { helpModeDirective } from '@abi-software/map-utilities';

export default {
  name: 'DynamicLegends',
  components: {
    LegendItem,
  },
  directives: {
    helpMode: helpModeDirective,
  },
  inject: {
    openHelpModeDrawer: { default: () => () => {} },
  },
  props: {
    identifierKey: {
      type: String,
      default: 'id',
    },
    styleKey: {
      type: String,
      default: 'style',
    },
    title: {
      type: String,
      default: '',
    },
    legends: {
      type: Array,
      default: function () {
        return [];
      },
    },
    showStarInLegend: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isHovering: false,
      hoverTimeout: null,
    };
  },
  methods: {
    onMouseOver() {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = setTimeout(() => {
        this.isHovering = true;
      }, 500);
    },
    onMouseOut() {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = setTimeout(() => {
        this.isHovering = false;
      }, 500);
    },
  },
};
</script>

<style lang="scss" scoped>
.legend-group {
  padding: 6px 0;
}

.legend-container {
  width: max-content;
}
</style>
