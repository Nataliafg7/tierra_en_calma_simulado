/// <reference types="cypress" />

describe('Seguridad - Protección visual de contraseña', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('SEC-04: la contraseña del login se mantiene oculta en pantalla', () => {
    cy.visit('http://localhost:4200/login');

    cy.get('.form-box.login input[name="loginContrasena"]')
      .should('have.attr', 'type', 'password')
      .type('ClaveSegura123');

    cy.get('.form-box.login input[name="loginContrasena"]')
      .should('have.attr', 'type', 'password');
  });

});