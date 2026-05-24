/// <reference types="cypress" />

describe('UI - Visualización de Mis Plantas', () => {
  it('UI-02: muestra las tarjetas de plantas y el botón para registrar una nueva', () => {
    const correo = 'jjuliana@gmail.com';
    const contrasena = 'Casasjuliana28';

    cy.intercept('POST', '**/api/login').as('login');

    cy.visit('http://localhost:4200/login');

    cy.get('.form-box.login input[name="loginCorreo"]')
      .should('be.visible')
      .type(correo);

    cy.get('.form-box.login input[name="loginContrasena"]')
      .should('be.visible')
      .type(contrasena);

    cy.get('.form-box.login button[type="submit"]')
      .click({ force: true });

    cy.wait('@login');

    cy.url({ timeout: 10000 })
      .should('include', '/mis-plantas');

    // Validar contenido principal
    cy.get('.plantas-grid', { timeout: 10000 })
      .should('be.visible');

    cy.get('.planta-card')
      .should('have.length.at.least', 1);

    cy.get('.planta-card')
      .first()
      .within(() => {
        cy.get('.planta-nombre').should('be.visible');
        cy.get('.planta-descripcion').should('be.visible');
        cy.contains('button', 'Monitorear').should('be.visible');
      });

    // Validar llamada visual a registrar nuevas plantas
    cy.get('.nuevas-plantas-section')
      .should('be.visible');

    cy.contains('button', 'Registrar nueva planta')
      .should('be.visible');
  });
});