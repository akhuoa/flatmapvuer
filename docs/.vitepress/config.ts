import path from 'path'
import { defineConfig } from 'vitepress'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// Version number
const versionNumber = process.env.npm_package_version

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "FlatmapVuer",
  description: "API documentation for FlatmapVuer",
  base: '/flatmapvuer/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'FlatmapVuer',
        items: [
          { text: 'Live Demo', link: '/demo-flatmapvuer' },
          { text: 'API References', link: '/components/FlatmapVuer' },
        ]
      },
      {
        text: 'MultiFlatmapVuer',
        items: [
          { text: 'Live Demo', link: '/demo-multiflatmapvuer' },
          { text: 'API References', link: '/components/MultiFlatmapVuer' },
        ]
      },
    ],

    sidebar: [
      {
        text: 'Live Demos',
        items: [
          { text: 'FlatmapVuer', link: '/demo-flatmapvuer' },
          { text: 'MultiFlatmapVuer', link: '/demo-multiflatmapvuer' }
        ]
      },
      {
        text: 'API References',
        items: [
          { text: 'FlatmapVuer', link: '/components/FlatmapVuer' },
          { text: 'MultiFlatmapVuer', link: '/components/MultiFlatmapVuer' },
        ]
      },
      {
        text: 'Version',
        items: [
          {
            text: `${versionNumber}`
          }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ABI-Software/flatmapvuer' }
    ]
  },
  markdown: { attrs: { disable: true } },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use '../src/assets/styles' as *;`
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../../src'),
      }
    },
    plugins: [
      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ['vue'],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/],
        resolvers: [
          ElementPlusResolver({
            importStyle: 'css',
          }),
        ],
      }),

      // https://github.com/antfu/unocss
      // see unocss.config.ts for config
    ]
  }
})
