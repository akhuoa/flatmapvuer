<template>
  <!-- flatmap-error -->
  <div class="flatmap-error">
    <div class="flatmap-error-title">
      <el-icon size="24">
        <el-icon-document-delete />
      </el-icon>
      <div v-if="flatmapError.title">
        {{ flatmapError.title }}
      </div>
    </div>
    <div class="flatmap-error-message" v-if="flatmapError.messages">
      <div v-for="(message, index) in flatmapError.messages" :key="index">
        {{ message }}
      </div>
    </div>
    <div v-if="flatmapError.button">
      <el-button class="button" type="primary" @click="flatmapError.button.callback">
        {{ flatmapError.button.text }}
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlatmapError',
  // The flatmapError prop is an object that may have the following properties:
  // 1. title: string
  // 2. messages: string[]
  // 3. button: { text: string, callback: Function }
  props: {
    flatmapError: {
      type: Object,
      default: () => ({}),
    },
  },
}
</script>

<style lang="scss" scoped>
  .flatmap-error {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 1rem;;
  }

  .flatmap-error-title {
    font-size: 18px;
    text-align: center;
  }

  .flatmap-error-message {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    line-height: 20px;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    max-width: 500px;
  }

  .el-button--primary.button {
    font-family: inherit;

    &:hover,
    &:active,
    &:focus {
      background: $app-primary-color;
      border-color: $app-primary-color;
      box-shadow: 0px 0px 2px 0px rgba(131, 0, 191, 0.5);
      color: #fff;
    }
  }
</style>
