/// <reference types="cypress" />

describe('Seguridad - Agregar planta sin iniciar sesión', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('SEC-02: no permite agregar una planta sin iniciar sesión', () => {
    cy.visit('http://localhost:4200/registrar-plantas');

    // El catálogo puede visualizarse sin login.
    cy.url().should('include', '/registrar-plantas');

    cy.get('.potus-section .btn-anadir', { timeout: 10000 })
      .should('be.visible');

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaSeguridad');
    });

    cy.get('.potus-section .btn-anadir')
      .click({ force: true });

    cy.get('@alertaSeguridad')
      .should('have.been.calledWith', 'Debes iniciar sesión antes de añadir plantas');

    cy.url({ timeout: 10000 }).should('include', '/login');
  });

});