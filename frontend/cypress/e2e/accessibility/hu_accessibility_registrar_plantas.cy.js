/// <reference types="cypress" />
import 'cypress-axe';

describe('Accesibilidad - Registrar Plantas', () => {
  it('A11Y-04: analiza accesibilidad de la pantalla Registrar Plantas', () => {
    cy.visit('http://localhost:4200/registrar-plantas');

    cy.get('.registrar-plantas-container', { timeout: 10000 })
      .should('be.visible');

    cy.get('.btn-anadir', { timeout: 10000 })
      .should('have.length.at.least', 1);

    cy.injectAxe();

    cy.checkA11y(
      '.registrar-plantas-container',
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      },
      (violations) => {
        cy.log(`Hallazgos detectados en Registrar Plantas: ${violations.length}`);
      },
      true
    );
  });
});