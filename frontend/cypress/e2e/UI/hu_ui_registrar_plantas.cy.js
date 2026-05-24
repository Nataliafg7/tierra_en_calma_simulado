/// <reference types="cypress" />

describe('UI - Pantalla Registrar Plantas', () => {
  it('UI-03: muestra el catálogo de plantas disponibles y sus botones Agregar', () => {
    cy.visit('http://localhost:4200/registrar-plantas');

    cy.get('.registrar-plantas-container', { timeout: 10000 })
      .should('be.visible');

    cy.get('.registro-header')
      .should('be.visible');

    // Validar las seis plantas del catálogo visual
    cy.get('.planta-section')
      .should('have.length', 6);

    cy.get('.potus-section')
      .within(() => {
        cy.contains('.planta-nombre', 'Potus').should('be.visible');
        cy.contains('button', 'Agregar').should('be.visible');
      });

    cy.get('.palma-areca-section')
      .within(() => {
        cy.contains('.planta-nombre', 'Palma Areca').should('be.visible');
        cy.contains('button', 'Agregar').should('be.visible');
      });

    cy.get('.btn-anadir')
      .should('have.length', 6);
  });
});