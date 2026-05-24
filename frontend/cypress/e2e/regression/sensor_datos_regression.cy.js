/// <reference types="cypress" />

describe('Regresion - sensor y datos', () => {
  it('mantiene visibles las lecturas y el grafico', () => {
    cy.clock();

    let datosCalls = 0;
    cy.intercept('GET', '**/api/datos', (req) => {
      datosCalls += 1;
      req.reply({
        body: {
          dato: datosCalls === 1 ? 'T:25.0, H:60.0' : 'T:26.4, H:55.0'
        }
      });
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      body: { historial: [] }
    }).as('historial');

    cy.visit('http://localhost:4200/monstera?pu=1');
    cy.wait('@datos');
    cy.wait('@historial');

    cy.contains('.monit-sensor-value', '25.0').should('be.visible');
    cy.contains('.monit-sensor-value', '60.0').should('be.visible');
    cy.get('canvas').should('be.visible');

    cy.tick(2000);
    cy.wait('@datos');
    cy.wait('@historial');

    cy.contains('.monit-sensor-value', '26.4').should('be.visible');
    cy.contains('.monit-sensor-value', '55.0').should('be.visible');
  });
});
