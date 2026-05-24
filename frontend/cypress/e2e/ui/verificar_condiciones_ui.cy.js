/// <reference types="cypress" />

describe('UI - verificar condiciones', () => {
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

  it('muestra los botones y el estado de la planta', () => {
    cy.contains('button', 'Verificar condiciones').should('be.visible');
    cy.contains('button', 'Regar ahora').should('be.visible');
    cy.contains('.status-chip', 'Conectado').should('be.visible');
    cy.contains('.monit-row', /Actualizaci[oó]n cada 2s/i).should('be.visible');
  });
});
