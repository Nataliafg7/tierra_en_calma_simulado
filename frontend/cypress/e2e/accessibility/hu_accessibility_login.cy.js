/// <reference types="cypress" />
import 'cypress-axe';

describe('Accesibilidad - Login de usuario', () => {
  it('A11Y-01: analiza accesibilidad del formulario de login', () => {
    cy.visit('http://localhost:4200/login');

    cy.get('.form-box.login', { timeout: 10000 })
      .should('be.visible');

    cy.injectAxe();

    cy.checkA11y(
      '.form-box.login',
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      },
      (violations) => {
        cy.log(`Hallazgos detectados en Login: ${violations.length}`);
      },
      true
    );
  });
});