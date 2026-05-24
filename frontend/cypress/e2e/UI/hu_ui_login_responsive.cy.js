/// <reference types="cypress" />

describe('UI - Responsive del login', () => {
  it('UI-04: mantiene visible el formulario de login en resolución móvil', () => {
    cy.viewport('iphone-x');

    cy.visit('http://localhost:4200/login');

    cy.get('.form-box.login', { timeout: 10000 })
      .should('be.visible');

    cy.get('.form-box.login input[name="loginCorreo"]')
      .should('be.visible');

    cy.get('.form-box.login input[name="loginContrasena"]')
      .should('be.visible');

    cy.get('.form-box.login button[type="submit"]')
      .should('be.visible');

    cy.get('body')
      .should('not.have.css', 'overflow-x', 'scroll');
  });
});