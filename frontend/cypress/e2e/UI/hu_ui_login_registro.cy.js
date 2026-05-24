/// <reference types="cypress" />

describe('UI - Login y registro de usuario', () => {
  it('UI-01: muestra el formulario de login y permite cambiar al registro', () => {
    cy.visit('http://localhost:4200/login');
    
    // Validar interfaz inicial de login
    cy.get('.form-box.login', { timeout: 10000 })
      .should('be.visible');
    
    cy.get('.form-box.login')
      .within(() => {
        cy.contains('h1', 'Inicio de sesión').should('be.visible');
        cy.get('input[name="loginCorreo"]').should('be.visible');
        cy.get('input[name="loginContrasena"]').should('be.visible');
        cy.contains('button', 'Ingresar').should('be.visible');
      });
    
    // Cambiar al formulario de registro
    cy.contains('button', 'Regístrate')
      .should('be.visible')
      .click({ force: true });
    
    // Validar interfaz de registro
    cy.get('.form-box.register', { timeout: 10000 })
      .should('be.visible');
    
    cy.get('.form-box.register')
      .within(() => {
        cy.contains('h1', 'Registro').should('be.visible');
        cy.get('input[name="regIdUsuario"]').should('be.visible');
        cy.get('input[name="regNombre"]').should('be.visible');
        cy.get('input[name="regApellido"]').should('be.visible');
        cy.get('input[name="regTelefono"]').should('be.visible');
        cy.get('input[name="regCorreo"]').should('be.visible');
        cy.get('input[name="regContrasena"]').should('be.visible');
        cy.contains('button', 'Registrar').should('be.visible');
      });

    // Validación seleccionada a partir de la recomendación de Cypress Studio AI.
    // Se ajustó el selector propuesto por IA para utilizar un elemento estable de la interfaz.
    cy.get('.form-box.register')
      .contains('h1', 'Registro')
      .should('be.visible');
  });
});