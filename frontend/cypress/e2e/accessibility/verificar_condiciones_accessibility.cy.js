/// <reference types="cypress" />

describe('Accesibilidad - verificar condiciones', () => {
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

  it('expone la accion manual con etiquetas comprensibles', () => {
    cy.injectAxe();

    cy.contains('button', 'Verificar condiciones').should('be.visible');
    cy.contains('button', 'Regar ahora').should('be.visible');
    cy.contains('.status-chip', 'Conectado').should('be.visible');

    cy.checkA11y('.tarjetas-save-date, .monit-card');
  });
});
