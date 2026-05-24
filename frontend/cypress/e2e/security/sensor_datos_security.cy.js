/// <reference types="cypress" />

describe('Seguridad - sensor y datos', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/datos', {
      body: { dato: 'LECTURA_INVALIDA' }
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      body: { historial: [] }
    }).as('historial');

    cy.visit('http://localhost:4200/monstera?pu=1');
    cy.wait('@datos');
    cy.wait('@historial');
  });

  it('no rompe la interfaz con una lectura malformada', () => {
    cy.contains('.monit-sensor-value', 'Temperatura:').should('contain.text', '---');
    cy.contains('.monit-sensor-value', 'Humedad del suelo:').should('contain.text', '---');
    cy.get('canvas').should('be.visible');
  });
});
