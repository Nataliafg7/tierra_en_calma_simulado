/// <reference types="cypress" />

describe('Seguridad - Intento de inyección en login', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('SEC-03: rechaza intento de inyección en el inicio de sesión', () => {
    cy.intercept('POST', '**/api/login').as('intentoLogin');

    cy.visit('http://localhost:4200/login');

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaLogin');
    });

    cy.get('.form-box.login input[name="loginCorreo"]')
      .should('be.visible')
      .type("' OR 1=1 --");

    cy.get('.form-box.login input[name="loginContrasena"]')
      .type("' OR 1=1 --");

    cy.get('.form-box.login button[type="submit"]')
      .click({ force: true });

    cy.wait('@intentoLogin');

    // El intento malicioso no debe conceder acceso.
    cy.url({ timeout: 10000 }).should('not.include', '/mis-plantas');

    cy.get('@alertaLogin').should('have.been.called');
  });

});