<template>
  <div class="legends-container">
    <svg
      version="1.1"
      id="Layer_1"
      x="0px"
      y="0px"
      viewBox="0 0 500 500"
      style="enable-background: new 0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:bx="https://boxy-svg.com"
    >
      <defs>
        <bx:grid height="30.447" width="32.516" x="0" y="0" />
      </defs>
      <path
        class="st0 st0-translate"
        d="M61.3,103.8c-15.9,0-28.8-12.3-28.8-27.3c0-15,13-27.3,28.8-27.3s28.8,12.3,28.8,27.3 C90.1,91.5,77.2,103.8,61.3,103.8z"
      />
      <path
        class="st1"
        d="M40.3,356.1C29.5,345,29.8,328,41.5,317.5c11.7-10.5,29.6-9.9,40.7,1.1c11.1,11,10.5,28.1-1.2,38.5 C69.3,367.4,51.1,366.9,40.3,356.1z"
      />
      <path
        class="st2"
        d="M61.2,396.9c-5.3,9.3-15.3,15.1-26.1,15.1l-0.4,0.6c5.1,9,5.1,20,0,29l0.4,0.6c10.7,0,20.8,5.8,26.1,15.1 c5.3-9.3,15.3-15.1,26.1-15.1c-5.3-9.3-5.3-20.9,0-30.4C76.6,412.1,66.7,406.3,61.2,396.9z"
      />
      <text
        transform="matrix(0.9908 0 0 1 118.0161 171.7975)"
        class="st3 st4 st5"
        style="white-space: pre"
      >
        Tissue region
      </text>
      <path
        class="st6"
        d="M40.9,231.1c11.3-10.6,29.5-10.6,40.8,0c11.3,10.6,11.3,27.9,0,38.5c-11.3,10.6-29.5,10.6-40.8,0 C29.7,259,29.7,241.7,40.9,231.1z"
      />
      <text
        transform="matrix(0.9908 0 0 1 118.0161 257.675)"
        class="st3 st4 st5"
        style="white-space: pre"
      >
        Brain nuclei
      </text>
      <!-- Hide this unti we can clarify the label
        <path class="st7" d="M34.3,174c-6.2-13.9,0.6-29.9,15.3-35.7c14.7-5.9,31.6,0.6,37.8,14.4c1.5,3.5,2.3,7,2.3,10.6 c0,10.6-6.6,20.8-17.6,25.2C57.5,194.3,40.5,187.9,34.3,174z"/>
        <text transform="matrix(0.9908 0 0 1 117.5474 171.7975)" class="st3 st4 st5" style="white-space: pre;">Specific anatomical structure</text>
        -->
      <text
        transform="matrix(0.9908 0 0 1 118.0903 345.5266)"
        class="st3 st4 st5"
        style="white-space: pre"
      >
        Ganglia
      </text>
      <text
        transform="matrix(0.9908 0 0 1 118.0903 433.1613)"
        class="st3 st4 st5"
        style="white-space: pre"
      >
        Ganglionated nerve plexus
      </text>
    </svg>
    <svg width="72px" height="72px" viewBox="0 0 24 24" fill="yellow"></svg>
  </div>
</template>

<script>
export default {
  name: 'SvgLegends',
};
</script>

<style lang="scss" scoped>
.legends-container {
  pointer-events: none;
  transform: translate(0px, -35px);
}

.st0-translate {
  transform: translate(0px, 88px);
}
.st0 {
  fill: #ff33cc;
}
.st1 {
  fill: #b2f074;
}
.st2 {
  opacity: 0.64;
  fill: #e4e417;
  enable-background: new;
}
.st3 {
  fill: #333333;
}
.st4 {
  font-family: Asap, sans-serif;
}
.st5 {
  font-size: 32px;
}
.st6 {
  fill: #f15a24;
}
.st7 {
  fill: #66ffff;
  stroke: #000000;
  stroke-width: 3;
}
</style>
