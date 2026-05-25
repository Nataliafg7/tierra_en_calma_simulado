/// <reference types="cypress" />
import 'cypress-axe';

describe('Accesibilidad - Registro de usuario', () => {
  it('A11Y-02: analiza accesibilidad del formulario de registro', () => {
    cy.visit('http://localhost:4200/login');

    cy.contains('Regístrate')
      .should('be.visible')
      .click({ force: true });

    cy.get('.form-box.register', { timeout: 10000 })
      .should('be.visible');

    cy.injectAxe();

    cy.checkA11y(
      '.form-box.register',
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      },
      (violations) => {
        cy.log(`Hallazgos detectados en Registro: ${violations.length}`);
      },
      true
    );
  });
});