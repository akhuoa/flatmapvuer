import path from "path";
const pathSrc = path.resolve(__dirname, "./src");
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const config = {
    css: {
        preprocessorOptions: {
          scss: {
            additionalData: `@use './src/assets/styles' as *;`
          },
        },
    },
    plugins: [
        vue({
          template: {
            compilerOptions: {
              isCustomElement: (tag) => ['bx:grid'].includes(tag),
            }
          }
        }),
        Components({
          // allow auto load markdown components under `./src/components/`
          extensions: ['vue', 'md'],
          // allow auto import and register components used in markdown
          include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
          resolvers: [
            ElementPlusResolver({
              importStyle: 'sass',
            }),
          ],
          dts: 'src/components.d.ts',
        }),
    
        // https://github.com/antfu/unocss
        // see unocss.config.ts for config
    ],
    build: {
      lib: {
        entry: path.resolve(__dirname, "./src/components/index.js"),
        name: "FlatmapVuer",
        fileName: 'flatmapvuer',
      },
      rollupOptions: {
        external: ["vue", "@abi-software/svg-sprite"],
        output: {
          globals: {
            vue: "Vue",
            "@abi-software/svg-sprite": "@abi-software/svg-sprite"
          },
        },
      },
    },
    optimizeDeps: {
      entries: ['./cypress/*']
    }
  };

  if (command === 'serve') {
    config.server =  {
        port: 8082,
    };
  }
  return config;
})
