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
    cy.get('button.register-btn').click({ force: true });
    // The login form is hidden.
    cy.get('div.login')
      .should(($el) => {
        expect($el).to.not.be.visible
        expect($el).to.have.class('hidden')
      })
    // The registration form is visible.
    cy.get('div.register')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.not.have.class('hidden')
      })
    
  });
});