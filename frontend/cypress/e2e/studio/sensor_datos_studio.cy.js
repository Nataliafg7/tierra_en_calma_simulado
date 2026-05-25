/// <reference types="cypress" />

describe('Studio - sensor y datos', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/datos', {
      body: { dato: 'T:25.0, H:60.0' }
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      body: { historial: [] }
    }).as('historial');

    cy.visit('http://localhost:4200/monstera?pu=1');
    cy.wait('@datos');
    cy.wait('@historial');
  });

  it('muestra la lectura actual y el grafico de relacion', () => {
    cy.contains('.monit-sensor-value', 'Temperatura:').should('be.visible');
    cy.contains('.monit-sensor-value', 'Humedad del suelo:').should('be.visible');
    cy.get('canvas').should('be.visible');
  });
});
