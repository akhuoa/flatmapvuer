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
      projectId: process.env.CYPRESS_PROJECT_ID,
      visualRegressionType: 'regression',
      visualRegressionBaseDirectory: 'cypress/screenshots/MultiFlatmapVuer.cy.js/base',
      visualRegressionDiffDirectory: 'cypress/screenshots/diff',
      visualRegressionGenerateDiff: 'always',
      visualRegressionFailSilently: true,
      HUMAN_FEMALE_UUID: process.env.HUMAN_FEMALE_UUID ? process.env.HUMAN_FEMALE_UUID : '',
      HUMAN_MALE_UUID: process.env.HUMAN_MALE_UUID ? process.env.HUMAN_MALE_UUID : '',
      RAT_UUID: process.env.RAT_UUID ? process.env.RAT_UUID : '',
      MOUSE_UUID: process.env.MOUSE_UUID ? process.env.MOUSE_UUID : '',
      PIG_UUID: process.env.PIG_UUID ? process.env.PIG_UUID : '',
      CAT_UUID: process.env.CAT_UUID ? process.env.CAT_UUID : '',
      ERROR_TOLERANCE: process.env.ERROR_TOLERANCE ? process.env.ERROR_TOLERANCE : 0.0001
    },
    screenshotsFolder: './cypress/screenshots',
    setupNodeEvents(on, config) {
      configureVisualRegression(on)

      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          // fullPage screenshot size is 1400x1200 on non-retina screens
          // and 2800x2400 on retina screens
          launchOptions.args.push('--window-size=1400,1200')

          // force screen to be non-retina (1400x1200 size)
          launchOptions.args.push('--force-device-scale-factor=1')

          // force screen to be retina (2800x2400 size)
          // launchOptions.args.push('--force-device-scale-factor=2')
        }

        if (browser.name === 'electron' && browser.isHeadless) {
          // fullPage screenshot size is 1400x1200
          launchOptions.preferences.width = 2000
          launchOptions.preferences.height = 2000
        }

        if (browser.name === 'firefox' && browser.isHeadless) {
          // menubars take up height on the screen
          // so fullPage screenshot size is 1400x1126
          launchOptions.args.push('--width=1400')
          launchOptions.args.push('--height=1200')
        }

        return launchOptions
      })
    },
  },
});

export default config;