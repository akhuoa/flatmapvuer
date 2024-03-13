import { defineConfig } from "cypress";

const config = defineConfig({
  "viewportWidth": 1920,
  "viewportHeight": 1080,
  defaultCommandTimeout: 30000,
  // reporter: "junit",
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    configFile: "reporter-config.json"
  },

  component: {
    specPattern: "cypress/component/*.cy.js",
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});

export default config;