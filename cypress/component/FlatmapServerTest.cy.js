import MultiFlatmapVuer from '../../src/components/MultiFlatmapVuer.vue';
const FLATMAP_API = 'https://mapcore-demo.org/current/flatmap/v3/';

describe('MultiFlatmapVuer Error Handling', () => {

  it('should handle 500 Internal Server Error', () => {
    cy.intercept('GET', FLATMAP_API, {
      statusCode: 500,
      body: 'Internal Server Error',
    }).as('serverError');

    cy.mount(MultiFlatmapVuer, {
      props: {
        flatmapAPI: FLATMAP_API,
        initial: 'Rat',
        availableSpecies: {
          Rat: {
            taxo: 'NCBITaxon:10114',
            iconClass: 'mapicon-icon_rat',
          },
        },
      },
    });

    cy.wait('@serverError');

    cy.get('.flatmap-error').should('exist');
    cy.contains('MultiFlatmap Error!').should('be.visible');
    cy.contains('unexpected error').should('be.visible');
    cy.contains('try again later').should('be.visible');
  });

  it('handles 500 with valid JSON body (would bypass catch)', () => {
    cy.intercept('GET', '**/flatmap/v3/', {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: [], // valid JSON array -> response.json() resolves
    }).as('serverErrorJson');

    cy.mount(MultiFlatmapVuer, {
      props: {
        flatmapAPI: FLATMAP_API,
        initial: 'Rat',
        availableSpecies: { Rat: { taxo: 'NCBITaxon:10114' } },
      },
    });

    cy.wait('@serverErrorJson');
    cy.get('.flatmap-error').should('exist');
  });

  it('should handle 404 endpoint error', () => {
    cy.intercept('GET', FLATMAP_API, {
      statusCode: 404,
      body: { status_code: 404 },
    }).as('notFoundError');

    cy.mount(MultiFlatmapVuer, {
      props: {
        flatmapAPI: FLATMAP_API,
        initial: 'Rat',
      },
    });

    cy.wait('@notFoundError');

    cy.contains('flatmap API endpoint is incorrect').should('be.visible');
  });

  it('should handle network failure', () => {
    cy.intercept('GET', FLATMAP_API, {
      forceNetworkError: true,
    }).as('networkError');

    cy.mount(MultiFlatmapVuer, {
      props: {
        flatmapAPI: FLATMAP_API,
        initial: 'Rat',
      },
    });

    cy.wait('@networkError');

    cy.get('.flatmap-error').should('exist');
  });
});
