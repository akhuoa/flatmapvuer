<template>
  <div class="legend-group">
    <div
      class="legend-container"
      v-for="item in legends"
      :key="item[identifierKey]"
      :label="item[identifierKey]"
    >
      <div
        v-if="legendStyle(item) === 'yellow-star'"
        :class="legendStyle(item)"
        v-html="showStarInLegend ? yellowstar : ''"
      ></div>
      <div v-else class="legend-item">
        <div
          :class="legendStyle(item)"
          :style="{ 'background-color': item[colourKey] }"
        ></div>
        <div class="label">{{ capitalise(item[identifierKey]) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import yellowstar from "../../icons/yellowstar";
/* eslint-disable no-alert, no-console */
export default {
  name: "DynamicLegends",
  props: {
    identifierKey: {
      type: String,
      default: "id",
    },
    colourKey: {
      type: String,
      default: "colour",
    },
    styleKey: {
      type: String,
      default: "style",
    },
    title: {
      type: String,
      default: "",
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
  data: function () {
    return {
      yellowstar: yellowstar,
    };
  },
  methods: {
    capitalise: function (label) {
      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    },
    legendStyle: function (item) {
      if (item[this.styleKey] === "star") {
        if (item[this.identifierKey] === "Featured dataset marker") {
          return "yellow-star";
        } else if (item[this.identifierKey] === "Gaglionated nerve plexus") {
          return "hexagon-star";
        }
      }
      return item[this.styleKey];
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

.legend-item {
  display: flex;
  align-items: center;
  margin: 8px 12.5px;
}

.circle {
  height: 20px;
  width: 20px;
  background-color: #ffffff;
  border-radius: 50%;
  display: inline-block;
}

// hexagon
.hexagon-star {
  width: 21px;
  height: 25px;
  background-color: #ffffff;
  opacity: 0.64;
  clip-path: path(
    "M10.48 0.76 c-2.12 3.72 -6.12 6.04 -10.44 6.04 l-0.16 0.24 c2.04 3.6 2.04 8 0 11.6 l0.16 0.24 c4.28 0 8.32 2.32 10.44 6.04 c2.12 -3.72 6.12 -6.04 10.44 -6.04 c-2.12 -3.72 -2.12 -8.36 0 -12.16 C16.64 6.84 12.68 4.52 10.48 0.76z"
  );
  -webkit-clip-path: path(
    "M10.48 0.76 c-2.12 3.72 -6.12 6.04 -10.44 6.04 l-0.16 0.24 c2.04 3.6 2.04 8 0 11.6 l0.16 0.24 c4.28 0 8.32 2.32 10.44 6.04 c2.12 -3.72 6.12 -6.04 10.44 -6.04 c-2.12 -3.72 -2.12 -8.36 0 -12.16 C16.64 6.84 12.68 4.52 10.48 0.76z"
  );
}

.label {
  margin-left: 14px;
  font-size: 12px;
  color: rgb(48, 49, 51);
}
</style>
