/// <reference types="cypress" />
import 'cypress-axe';

describe('Accesibilidad - Mis Plantas', () => {
  it('A11Y-03: analiza accesibilidad de la visualización de plantas', () => {
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

    cy.get('.plantas-grid', { timeout: 10000 })
      .should('be.visible');

    cy.get('.planta-card', { timeout: 10000 })
      .should('have.length.at.least', 1);

    cy.injectAxe();

    cy.checkA11y(
      '.plantas-grid',
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      },
      (violations) => {
        cy.log(`Hallazgos detectados en Mis Plantas: ${violations.length}`);
      },
      true
    );
  });
});