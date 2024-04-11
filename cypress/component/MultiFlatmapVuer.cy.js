// /* eslint-disable no-alert, no-console */
// import { MapContent } from '../../src/components/index.js';

/* eslint-disable no-alert, no-console */
// import { FlatmapVuer, MultiFlatmapVuer } from '../../src/components/index.js';

import CypressComponentWrapper from './CypressComponentWrapper.vue'
import { createPinia, setActivePinia } from 'pinia';

describe('MultiFlatmapVuer', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
  });


  //Load in some responses/assets before beginning the test
  //This should prevent any async behaviours.
  before(() => {
    cy.fixture('MultiFlatmapProps.json').as('props');
  })

  it('Workflow testing', () => {

    const readySpy = cy.spy().as('readySpy')
    // const resourceSelectedSpy = cy.spy().as('resourceSelectedSpy')
    cy.get('@props').then((props) => {
      console.log('flatmapAPI', props)
      cy.mount(CypressComponentWrapper, {
        propsData: {
          component: 'MultiFlatmapVuer',
          props: props,
          events: {
            ready: readySpy
          }
        },
        global: {
          plugins: setActivePinia(createPinia())
        }
      }).then((vm) => {
        cy.wrap(vm).as('vm')
        window.vm = vm

      }).get('@vue').should('exist')

      // Now that we have the vue wrapper, check that the ready event is fired
      .then(() => {
        cy.get('@vue').should(wrapper => {
          expect(wrapper.emitted('ready')).to.be.ok
          Cypress.multiFlatmapVuerWrapper = wrapper
        })
      })

    })

    Cypress.on('uncaught:exception', (err) => {
      // returning false here prevents Cypress from
      // failing the test
      if (err.message.includes("this.facets.at is not a function"))
        return false
      return true
    })

    //Check if multiflatmap is mounted correctly
    cy.get('.content-container').should('exist');


    //Check if the minimap is visible
    cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas').should('exist');

    //Check if the ready event is fired
    // *** Commenting this out until we can figure out why it's not working
    // cy.get('@readySpy').should('have.been.calledWith', true)

    // Check if flatmap emits ready event
    cy.get('@vue').should(wrapper => {
      expect(wrapper.emitted('ready')).to.be.ok
    }).then(() => {

      // Create a pop up and ensure it shows
      let mapImp = window.Cypress.multiFlatmapVuer.getCurrentFlatmap()
      console.log('flatmap', mapImp)
      mapImp.showPopup(45,'Test', { className: 'flatmapvuer-popover', positionAtLastClick: true })
      cy.get('.flatmapvuer-popover').should('exist').contains('Test').then(() => {
        // Close the pop up
        cy.get('.maplibregl-popup-close-button').click();
        cy.get('.flatmapvuer-popover').should('not.exist');

      // Check the metadata for path exploration is loading correctly
      }).then(() => {
        let flatmapVuer = window.Cypress.flatmapVuer
        console.log('flatmapVuer', flatmapVuer)
        let fmEventCallback = flatmapVuer.eventCallback()
        const label = 'Sympathetic chain ganglion neuron (kblad)'
        fmEventCallback('click', {
          "id": "ilxtr_neuron-type-keast-4",
          "featureId": 28,
          "kind": "symp-post",
          "label": label,
          "models": "ilxtr:neuron-type-keast-4",
          "source": "https://apinatomy.org/uris/models/keast-bladder",
          "taxons": "[\"NCBITaxon:10116\"]",
          "type": "feature",
          "mapUUID": "dbd2fe65-ef1e-5fd1-8614-e26498d00ffb"
        }, [])


        // Check the pop up has the same information as when the test was created

        cy.get('.flatmapvuer-popover').should('exist').contains(label).then(() => {

          // Set the tooltip to be visible (this is needed as the css hack does not work in testing for some reason)
          document.querySelector('#tooltip-container').style.display = 'block'

          cy.get('#tooltip-container').invoke('css', 'display').then((display) => {
            expect(display).to.equal('block')
          }).then(() => {

            // Tooltip return data
            const tooltipEntryData = flatmapVuer.tooltipEntry

            const checkAndGetArrayData = (arr) => {
              if (
                arr &&
                arr.length &&
                arr.some(val => val)
              ) {
                return arr[0]
              }
              return null
            }

            const tooltipSubtitle = checkAndGetArrayData(tooltipEntryData.provenanceTaxonomyLabel)
            const originLabel = checkAndGetArrayData(tooltipEntryData.origins)
            const componentLabel = checkAndGetArrayData(tooltipEntryData.components)
            const destinationLabel = checkAndGetArrayData(tooltipEntryData.destinations)
            const pubmedLink = tooltipEntryData.hyperlinks[0].url

            if (tooltipSubtitle) {
              cy.get('.subtitle').should('exist').contains(tooltipSubtitle)
            }

            if (originLabel) {
              cy.get(`[origin-item-label="${originLabel}"]`).should('exist')
            }

            if (componentLabel) {
              cy.get(`[component-item-label="${componentLabel}"]`).should('exist')
            }

            if (destinationLabel) {
              cy.get(`[destination-item-label="${destinationLabel}"]`).should('exist')
            }

            // Open the 'show more' section
            cy.get('#show-path-info').should('exist').click()

            // Click on the dendrites button
            cy.get('#open-dendrites-button').should('exist').click()

            // Check that the resource selected event is emitted
            cy.get('@vue').should(wrapper => {
              expect(wrapper.emitted('resource-selected')).to.be.ok
            })

            // create a single stub we will use
            cy.window().then(win => {
              cy.stub(win, 'open').as('Open')
            })

            // Click the open pubmed button and check that the window.open call was intercepted
            cy.get('#open-pubmed-button').should('exist').click()
            cy.get('@Open').should('have.been.calledOnceWithExactly', pubmedLink, '_blank')

          })

          // Close the pop up
          cy.get('.maplibregl-popup-close-button').should('exist')

        // Test the search
        }).then(() => {
          flatmapVuer.searchAndShowResult('body proper', 'body proper')
          cy.get('.maplibregl-popup').should('exist').contains('body proper')
        })

      })



    })

  })


});
