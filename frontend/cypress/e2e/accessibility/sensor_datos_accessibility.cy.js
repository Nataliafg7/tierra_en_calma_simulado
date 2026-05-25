/// <reference types="cypress" />
import { logA11yViolations } from '../../support/a11y-log';

describe('Accesibilidad - sensor y datos', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/datos', {
      body: { dato: 'T:25.0, H:60.0' }
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      body: { historial: [] }
    }).as('historial');

    cy.visit('http://localhost:4200/monstera?pu=1');
    cy.wait('@datos');
    cy.wait('@historial');
  });

  it('expone lectura actual y grafico de forma accesible', () => {
    cy.injectAxe();

    cy.contains('.monit-sensor-value', 'Temperatura:').should('be.visible');
    cy.contains('.monit-sensor-value', 'Humedad del suelo:').should('be.visible');
    cy.get('canvas').should('be.visible');

    cy.checkA11y('.portada, .seccion-blanca', null, logA11yViolations);
  });
});
