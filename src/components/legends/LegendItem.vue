<template>
  <div class="legend-item" v-if="legendStyleValue">
    <template v-if="clipPathLegends.includes(legendStyleValue)">
      <div
        :class="legendStyleValue"
        :style="customClipPathStyle(true)"
      >
        <div
          :class="legendStyleValue"
          :style="customClipPathStyle(false)"
        >
        </div>
      </div>
    </template>
    <template v-else>
      <div
        :class="legendStyleValue"
        :style="customStyle"
      >
      </div>
    </template>
    <div class="label">{{ capitalise(item[identifierKey]) }}</div>
  </div>
</template>

<script>
const starTemplate = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="<fillColor>" stroke="<borderColor>" stroke-width="<borderWidth>" d="M11.0748 3.25583C11.4141 2.42845 12.5859 2.42845 12.9252 3.25583L14.6493 7.45955C14.793 7.80979 15.1221 8.04889 15.4995 8.07727L20.0303 8.41798C20.922 8.48504 21.2841 9.59942 20.6021 10.1778L17.1369 13.1166C16.8482 13.3614 16.7225 13.7483 16.8122 14.1161L17.8882 18.5304C18.1 19.3992 17.152 20.0879 16.3912 19.618L12.5255 17.2305C12.2034 17.0316 11.7966 17.0316 11.4745 17.2305L7.60881 19.618C6.84796 20.0879 5.90001 19.3992 6.1118 18.5304L7.18785 14.1161C7.2775 13.7483 7.1518 13.3614 6.86309 13.1166L3.3979 10.1778C2.71588 9.59942 3.07796 8.48504 3.96971 8.41798L8.50046 8.07727C8.87794 8.04889 9.20704 7.80979 9.35068 7.45955L11.0748 3.25583Z"/></svg>'

/* eslint-disable no-alert, no-console */
export default {
  name: "LegendItem",
  props: {
    item: {
      type: Object,
      required: true,
    },
    identifierKey: {
      type: String,
      default: "id",
    },
    styleKey: {
      type: String,
      default: "style",
    },
    showStarInLegend: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    clipPathLegends: function () {
      return ['exoid', 'hexagon'];
    },
    legendStyleValue: function () {
      if (this.item[this.styleKey] === "star") {
        if (this.item[this.identifierKey] === "Featured dataset marker") {
          if (!this.showStarInLegend) {
            return;
          }
        }
        return 'star';
      } else if (this.clipPathLegends.includes(this.item[this.styleKey])) {
        return this.item[this.styleKey];
      } else if (this.item[this.styleKey] === 'line') {
        return [this.item[this.styleKey], this.item.dashed ? 'dashed' : '', this.item.arrow ? 'arrow' : ''];
      }
      return [this.item[this.styleKey], 'shape'];
    },
    customStyle: function() {
      const specifiedColour = this.item["color"] ? this.item["color"] : this.item["colour"];
      let colour = specifiedColour ? specifiedColour : "transparent";
      let borderColour = this.item.border ? this.item.border : "black";
      let borderStyle = this.item.borderStyle ? this.item.borderStyle : "default";
      if (specifiedColour && !this.item.border) {
        borderColour = colour;
      }
      if (this.item[this.styleKey] === 'star') {
        let star = starTemplate.replace('<fillColor>', colour);
        star = star.replace('<borderColor>', borderColour);
        star = star.replace('<borderWidth>', borderColour ? '2' : '0');
        star = 'data:image/svg+xml,' + encodeURIComponent(star);
        return { 'color': colour, 'background-image': `url(${star})` };
      } else if (this.item[this.styleKey] === 'line') {
        return {'color': colour};
      } else {
        return { 'background-color': colour, 'border-color': borderColour, 'border-style': borderStyle};
      }
    },
  },
  methods: {
    capitalise: function (label) {
      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    },
    customClipPathStyle: function(isBorder) {
      const style = {...this.customStyle};
      if (isBorder) {
        style['background-color'] = style['border-color'];
      } else {
        style.scale = 0.7;
      }
      return style;
    },
  },
};
</script>

<style lang="scss" scoped>
.legend-item {
  display: flex;
  align-items: center;
  margin: 8px 12.5px;
}

.line {
  position: relative;
  width: 20px;
  border-top: 2px solid currentColor;
}

.line.dashed {
  border-top: 2px dashed currentColor;
}

.line::after {
  content: "";
  position: absolute;
  right: -2px;
  top: -5px;
  width: 0;
  height: 0;
  border-left: 7px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  display: none;
}

.line.arrow::after {
  display: block;
}

.shape {
  height: 16px;
  width: 16px;
  border-color: black;
  border-style: solid;
  border-width: 2px;
  background-color: transparent;
  display: inline-block;
}

.circle {
  border-radius: 50%;
}

.rounded-square {
  border-radius: 30%;
}

.hexagon {
  width: 20px;
  height: calc(20px * 0.866);
  background-color: transparent;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  -webkit-clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}

.exoid {
  width: 20px;
  height: 25px;
  background-color: transparent;
  clip-path: path(
    "M9.96 0.72 c-2.01 3.53 -5.81 5.74 -9.92 5.74 l-0.15 0.23 c1.94 3.42 1.94 7.6 0 11.02 l0.15 0.23 c4.07 0 7.9 2.2 9.92 5.74 c2.01 -3.53 5.81 -5.74 9.92 -5.74 c-2.01 -3.53 -2.01 -7.94 0 -11.55 C15.81 6.5 12.04 4.29 9.96 0.72z"
  );
  -webkit-clip-path: path(
    "M9.96 0.72 c-2.01 3.53 -5.81 5.74 -9.92 5.74 l-0.15 0.23 c1.94 3.42 1.94 7.6 0 11.02 l0.15 0.23 c4.07 0 7.9 2.2 9.92 5.74 c2.01 -3.53 5.81 -5.74 9.92 -5.74 c-2.01 -3.53 -2.01 -7.94 0 -11.55 C15.81 6.5 12.04 4.29 9.96 0.72z"
  );
}

.star {
  width: 25px;
  height: 25px;
  background-color: transparent !important;
  background-repeat: no-repeat;
  background-size: contain;
  display: inline-block;
  margin: -3px;
  padding-right: 2px;
}

.label {
  margin-left: 14px;
  font-size: 12px;
  color: rgb(48, 49, 51);
}
</style>
