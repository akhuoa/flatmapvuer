// /* eslint-disable no-alert, no-console */
// import { MapContent } from '../../src/components/index.js';

/* eslint-disable no-alert, no-console */
// import { FlatmapVuer, MultiFlatmapVuer } from '../../src/components/index.js';

const flatmapServers = ['@stagingProps', '@currentProps']
const availableSpecies = [
  { name: "Human Female" },
  { name: "Human Male" },
  { name: "Rat" },
  { name: "Mouse" },
  { name: "Pig" },
  { name: "Cat" }
]
const organTypes = ['color', 'grayscale']
const ERROR_TOLERANCE = parseFloat(Cypress.env('ERROR_TOLERANCE'))

describe('MultiFlatmapVuer', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.fixture('MultiFlatmapPropsCurrent.json').as('currentProps');
    cy.fixture('MultiFlatmapPropsDevel.json').as('develProps');
    cy.fixture('MultiFlatmapPropsReference.json').as('referenceProps');
    cy.fixture('MultiFlatmapPropsStaging.json').as('stagingProps');
  });


  //Load in some responses/assets before beginning the test
  //This should prevent any async behaviours.
  before(() => {
    // moved to beforeEach
    // cy.fixture('MultiFlatmapProps.json').as('props');
  })

  it('Workflow testing', () => {
    cy.loadMultiFlatmap('@develProps')

    //Check if the minimap is visible
    cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas').should('exist');

    // Check if flatmap emits ready event
    cy.get('@readySpy').should('have.been.calledWith').then(() => {
      // Create a pop up and ensure it shows
      const flatmapVuer = window.Cypress.multiFlatmapVuer.getCurrentFlatmap()
      const flatmapUUID = flatmapVuer.mapImp.uuid;
      flatmapVuer.showPopup(39, 'Test', { className: 'flatmapvuer-popover', positionAtLastClick: true })

      cy.get('.flatmapvuer-popover').should('exist').contains('Test').then(() => {
        // Close the pop up
        cy.get('.maplibregl-popup-close-button').click();
        cy.get('.flatmapvuer-popover').should('not.exist');

        // Check if alert exist in test flatmap
        cy.get('.maplibregl-touch-zoom-rotate > .maplibregl-canvas').as('canvas')
        cy.get('.checkall-display-text').then(($label) => {
          expect($label, 'Alter filter should exist').to.contain('Alert')
          // Take a screenshot of no path flatmap
          cy.get('.pathway-location > .pathway-container:visible').contains('Alert').parent().siblings().children('.el-checkbox').click()
          cy.get('.pathway-location > .drawer-button:visible').click()
          // CLI
          cy.get('@canvas').screenshot('base/cypress/component/MultiFlatmapVuer.cy.js/mapalert')
          // UI
          cy.get('@canvas').screenshot('MultiFlatmapVuer.cy.js/base/cypress/component/MultiFlatmapVuer.cy.js/mapalert')
          // Compare previous screenshot with alter paths displayed flatmap
          cy.get('.pathway-location > .drawer-button:visible').click()
          cy.get('[label="alert"] > .checkbox-container > .el-checkbox:visible').click()
          cy.get('.pathway-location > .drawer-button:visible').click()
          cy.get('@canvas').compareSnapshot('mapalert').then(comparisonResults => {
            expect(comparisonResults.percentage).to.greaterThan(0)
          })
        })
        // Check the metadata for path exploration is loading correctly
      }).then(() => {
        let fmEventCallback = flatmapVuer.eventCallback()
        fmEventCallback(
          "click",
          {
            id: "ilxtr:neuron-type-keast-5",
            featureId: 26,
            kind: "sensory",
            label: "neuron type kblad 5",
            models: "ilxtr:neuron-type-keast-5",
            source: "ilxtr:neuron-type-keast-5",
            taxons: '["NCBITaxon:10116"]',
            completeness: true,
            type: "feature",
            mapUUID: flatmapUUID,
          },
          []
        );

        cy.get('.flatmapvuer-popover').should('exist').contains('Neuron type kblad 5').then(() => {

          // Set the tooltip to be visible (this is needed as the css hack does not work in testing for some reason)
          document.querySelector('#tooltip-container').style.display = 'block'

          cy.get('#tooltip-container').invoke('css', 'display').then((display) => {
            expect(display).to.equal('block')
          }).then(() => {
            // Check the pop up has the same information as when the test was created
            cy.get('.subtitle').should('exist').contains('Studied in Rattus norvegicus species')

            // Open the 'show more' section
            cy.get('#show-path-info').should('exist').click()

            cy.get('[origin-item-label="lamina VII of gray matter of spinal cord, L6 segment of lumbar spinal cord"]').should('exist')
            cy.get('[component-item-label="pelvic splanchnic nerve"]').should('exist')
            cy.get('[destination-item-label="pelvic ganglion"]').should('exist')

            // Click on the dendrites button
            cy.get('#open-dendrites-button').should('exist').click()

            // Check that the resource selected event is emitted
            cy.get('@resourceSelectedSpy').should('have.been.calledWith')

            // create a single stub we will use
            cy.window().then(win => {
              cy.stub(win, 'open').as('Open')
            })

            // References
            cy.get('.resource-container').should('exist')
            cy.get('.citation-list').should('exist')
            cy.get('.citation-list').find('li').should('have.length', 7)
            const citationText = 'Androgen-sensitive preganglionic neurons innervate the male rat pelvic ganglion.'
            cy.get('.citation-list li.loading').should('not.exist').then(() => {
              cy.get('.citation-list li').should('exist').contains(citationText);
            })
          })

          // Close the pop up
          cy.get('.maplibregl-popup-close-button').should('exist')

          // Test the search
        }).then(() => {
          flatmapVuer.searchAndShowResult('body proper', true)
          cy.get('.maplibregl-popup').should('exist').contains('Body proper')
        })

      })

    })

  })

  it('change different species', () => {
    cy.loadMultiFlatmap('@develProps')

    // Check if flatmap emits ready event
    cy.get('@readySpy').should('have.been.calledWith').then(() => {
      const multiFlatmapVuer = window.Cypress.multiFlatmapVuer

      cy.get('@develProps').then((props) => {
        const availableSpecies = []
        for (const [key, value] of Object.entries(props.availableSpecies)) {
          availableSpecies.push({ name: key, taxon: value.taxo })
        }

        availableSpecies.forEach((species) => {
          cy.then(() => {
            multiFlatmapVuer.setSpecies(
              species.name,
              multiFlatmapVuer.state ? multiFlatmapVuer.state.state : undefined,
              1
            )

            expect(multiFlatmapVuer.activeSpecies).to.eq(species.name)
            cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas').should('exist');
            cy.get('.maplibregl-map').should('exist');
            cy.get('.pathway-location').should('exist');

            cy.wait(8000)
          })
        })
      })
    })
  })

  it('prepare reference images', () => {
    cy.loadMultiFlatmap('@referenceProps')

    cy.get('@readySpy').should('have.been.calledWith').then(() => {
      const multiFlatmapVuer = window.Cypress.multiFlatmapVuer

      cy.get('@referenceProps').then((props) => {
        const availableSpecies = []
        for (const [key, value] of Object.entries(props.availableSpecies)) {
          availableSpecies.push({ name: key, taxon: value.taxo })
        }

        availableSpecies.forEach((species) => {
          cy.then(() => {
            multiFlatmapVuer.setSpecies(
              species.name,
              multiFlatmapVuer.state ? multiFlatmapVuer.state.state : undefined,
              1
            )
            cy.wait(1000)
            cy.get('.el-loading-mask', { timeout: 30000 }).should('not.exist')
            expect(multiFlatmapVuer.activeSpecies).to.eq(species.name)
            const flatmapVuer = multiFlatmapVuer.$refs[species.name][0]
            // hide pathways
            cy.get('.pathway-location > .pathway-container:visible').contains('Pathways').parent().siblings().children('.el-checkbox').click()
            // hide drawer
            cy.get('.pathway-location > .drawer-button:visible').click()
            cy.wait(2000)

            cy.get('.maplibregl-touch-zoom-rotate > .maplibregl-canvas:visible').as('canvas')
            organTypes.forEach((type) => {
              cy.then(() => {
                if (type === 'grayscale') {
                  flatmapVuer.mapImp.setPaint({ coloured: false })
                  cy.wait(3000)
                }
                // CLI
                cy.get('@canvas').screenshot(`base/cypress/component/MultiFlatmapVuer.cy.js/${species.name}_${type}`)
                // UI
                cy.get('@canvas').screenshot(`MultiFlatmapVuer.cy.js/base/cypress/component/MultiFlatmapVuer.cy.js/${species.name}_${type}`)
              })
            })
          })
        })
      })
    })
  })

  flatmapServers.forEach((entry) => {
    availableSpecies.forEach((species) => {
      it(`image rendering for ${entry}-${species.name}`, () => {
        cy.loadMultiFlatmap(entry, species.name)

        cy.get('@readySpy').should('have.been.calledWith').then(() => {
          const multiFlatmapVuer = window.Cypress.multiFlatmapVuer
          const flatmapVuer = multiFlatmapVuer.$refs[species.name][0]

          cy.then(() => {
            cy.wait(1000)
            cy.get('.el-loading-mask', { timeout: 30000 }).should('not.exist')
            expect(multiFlatmapVuer.activeSpecies, `Active species should be ${species.name}`).to.eq(species.name)
            // hide pathways
            cy.get('.pathway-location > .pathway-container:visible').contains('Pathways').parent().siblings().children('.el-checkbox').click()
            // hide drawer
            cy.get('.pathway-location > .drawer-button:visible').click()
            cy.wait(2000)

            cy.get('.maplibregl-touch-zoom-rotate > .maplibregl-canvas:visible').as('canvas')
            cy.log(`THE LATEST ${entry} ${species.name} MAP UUID IS ${flatmapVuer.mapImp.uuid}`)
            organTypes.forEach((type) => {
              cy.then(() => {
                if (type === 'grayscale') {
                  flatmapVuer.mapImp.setPaint({ coloured: false })
                  cy.wait(3000)
                }
                cy.get('@canvas').compareSnapshot(`${species.name}_${type}`).then(comparisonResults => {
                  // Percentage of minor pixel changes usually very small
                  // Assume it will not have lot of pixel update in normal case
                  expect(comparisonResults.percentage, `${species.name}_color maps should be almost identical`).to.be.lessThan(ERROR_TOLERANCE)
                })
              })
            })
          })
        })
      })
    })
  })

});
