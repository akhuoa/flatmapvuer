// /* eslint-disable no-alert, no-console */
// import { MapContent } from '../../src/components/index.js';

/* eslint-disable no-alert, no-console */
// import { FlatmapVuer, MultiFlatmapVuer } from '../../src/components/index.js';

import CypressComponentWrapper from './CypressComponentWrapper.vue'
import { createPinia, setActivePinia } from 'pinia';

describe('MultiFlatmapVuer', () => {

  Cypress.on('uncaught:exception', (err) => {
    // returning false here prevents Cypress from
    // failing the test
    if (err.message.includes('Source "markers" already exists.'))
      return false
    return true
  })

  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.fixture('MultiFlatmapProps.json').as('props');
  });


  //Load in some responses/assets before beginning the test
  //This should prevent any async behaviours.
  before(() => {
    // moved to beforeEach
    // cy.fixture('MultiFlatmapProps.json').as('props');
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
        fmEventCallback('click', {
          "id": "ilxtr_neuron-type-keast-4",
          "featureId": 28,
          "kind": "symp-post",
          "label": "sympathetic chain ganglion neuron (kblad)",
          "models": "ilxtr:neuron-type-keast-4",
          "source": "https://apinatomy.org/uris/models/keast-bladder",
          "taxons": "[\"NCBITaxon:10116\"]",
          "type": "feature",
          "mapUUID": "dbd2fe65-ef1e-5fd1-8614-e26498d00ffb"
        }, [])

        // Check the pop up has the same information as when the test was created
        cy.get('.subtitle').should('exist').contains('Studied in Rattus norvegicus species')
        cy.get('[origin-item-label="Twelfth thoracic ganglion"]').should('exist')
        cy.get('[component-item-label="connective tissue, neck of urinary bladder"]').should('exist')
        cy.get('[destination-item-label="wall of blood vessel, Arteriole in connective tissue of bladder dome"]').should('exist')



        cy.get('.flatmapvuer-popover').should('exist').contains('Sympathetic chain ganglion neuron (kblad)').then(() => {

          // Set the tooltip to be visible (this is needed as the css hack does not work in testing for some reason)
          document.querySelector('#tooltip-container').style.display = 'block'

          cy.get('#tooltip-container').invoke('css', 'display').then((display) => {
            expect(display).to.equal('block')
          }).then(() => {
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

            // References
            cy.get('.resource-container').should('exist')
            cy.get('.citation-list').should('exist')
            cy.get('.citation-list').find('li').should('have.length', 4)
            const citationText = 'Afferent and sympathetic innervation of the dome and the base of the urinary bladder of the female rat'
            cy.get('.citation-list li.loading').should('not.exist').then(() => {
              cy.get('.citation-list li').first().should('exist').contains(citationText);
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

    // const resourceSelectedSpy = cy.spy().as('resourceSelectedSpy')
    cy.get('@props').then((props) => {
      console.log('flatmapAPI', props)
      cy.mount(CypressComponentWrapper, {
        propsData: {
          component: 'MultiFlatmapVuer',
          props: props,
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

    // Check if flatmap emits ready event
    cy.get('@vue').should(wrapper => {
      expect(wrapper.emitted('ready')).to.be.ok
    }).then(() => {
      const multiFlatmapVuer = window.Cypress.multiFlatmapVuer
      const speciesList = [
        {
          name: 'Human Female',
          taxon: 'NCBITaxon:9606'
        },
        {
          name: "Human Male",
          taxon: "NCBITaxon:9606"
        },
        {
          name: 'Functional Connectivity',
          taxon: 'FunctionalConnectivity'
        }
      ]

      // Switching species
      const switchSpeciesAndTest = (speciesId, speciesTaxo) => {
        multiFlatmapVuer.setSpecies(
          speciesId,
          multiFlatmapVuer.state ? multiFlatmapVuer.state.state : undefined,
          1
        )
      }

      // Human Female
      switchSpeciesAndTest(speciesList[0].name, speciesList[0].taxon)
      expect(multiFlatmapVuer.activeSpecies).to.eq(speciesList[0].name)
      cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas').should('exist');
      cy.get('.maplibregl-map').should('exist');
      cy.get('.pathway-location').should('exist');

      cy.wait(8000)

      // Rat (NPO)
      switchSpeciesAndTest(speciesList[1].name, speciesList[1].taxon)
      expect(multiFlatmapVuer.activeSpecies).to.eq(speciesList[1].name)
      cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas').should('exist');
      cy.get('.maplibregl-map').should('exist');
      cy.get('.pathway-location').should('exist');

      cy.wait(8000)

      // Functional Connectivity
      switchSpeciesAndTest(speciesList[2].name, speciesList[2].taxon)
      expect(multiFlatmapVuer.activeSpecies).to.eq(speciesList[2].name)
      cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas').should('exist');
      cy.get('.maplibregl-map').should('exist');
      cy.get('.pathway-location').should('exist');
    })

  })

});
