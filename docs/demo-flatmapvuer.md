# FlatmapVuer Live Demo

## Live Demo

<div class="demo-map-container">
  <div class="demo-map-container-inner">
    <ClientOnly>
      <FlatmapVuer
        entry="NCBITaxon:10114"
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

const FlatmapVuer = defineClientComponent(() => {
  return import('../src/components/FlatmapVuer.vue')
})
</script>

<script>
export default {
  data: function() {
    return {

    };
  }
}
</script>

## Code Preview

```js-vue
  <div class="your-outer-container">
    <FlatmapVuer
      entry="NCBITaxon:10114"
    />
  </div>

  <script>
    import { FlatmapVuer } from '@abi-software/flatmapvuer';
    import '@abi-software/flatmapvuer/dist/style.css';

    export default {
      components: { FlatmapVuer },
      data: function () {
        return {

        }
      }
    }
  </script>
```
