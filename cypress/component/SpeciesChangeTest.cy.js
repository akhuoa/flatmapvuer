// Extracted from MultiFlatmapVuer.cy.js
describe('MultiFlatmapVuer', () => {

  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.fixture('MultiFlatmapPropsDevel.json').as('develProps');
  });

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

        for (let i = 0; i < availableSpecies.length; i++) {
          const species = availableSpecies[i];

          cy.then(() => {
            multiFlatmapVuer.setSpecies(
              species.name,
              multiFlatmapVuer.state ? multiFlatmapVuer.state.state : undefined,
              1
            )
          })

          cy.get('.el-loading-mask', { timeout: 30000 }).should('not.exist')
          cy.wrap(multiFlatmapVuer).its('activeSpecies').should('eq', species.name)
          cy.get('#maplibre-minimap > .maplibregl-canvas-container > .maplibregl-canvas').should('exist');
          cy.get('.maplibregl-map').should('exist');
          cy.get('.pathway-location').should('exist');
        }
      })
    })
  })

});
