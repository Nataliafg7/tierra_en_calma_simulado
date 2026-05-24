/// <reference types="cypress" />

describe('Seguridad - Acceso a Mis Plantas', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('SEC-01: no permite acceder a Mis Plantas sin iniciar sesión', () => {
    cy.visit('http://localhost:4200/mis-plantas');

    cy.url({ timeout: 10000 }).should('include', '/login');

    cy.get('.form-box.login input[name="loginCorreo"]', { timeout: 10000 })
      .should('be.visible');

    cy.get('.form-box.login input[name="loginContrasena"]')
      .should('be.visible');
  });

});