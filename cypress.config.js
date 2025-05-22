import { defineConfig } from "cypress";
import { configureVisualRegression } from 'cypress-visual-regression';

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
    env: {
      visualRegressionType: 'regression',
      visualRegressionBaseDirectory: 'cypress/screenshots/MultiFlatmapVuer.cy.js/base',
      visualRegressionDiffDirectory: 'cypress/screenshots/diff',
      visualRegressionGenerateDiff: 'always',
      visualRegressionFailSilently: true,
    },
    screenshotsFolder: './cypress/screenshots',
    setupNodeEvents(on, config) {
      configureVisualRegression(on)
    },
  },
});

export default config;