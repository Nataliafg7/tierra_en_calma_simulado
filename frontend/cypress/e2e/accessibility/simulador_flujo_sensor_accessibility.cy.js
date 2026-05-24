/// <reference types="cypress" />
import { logA11yViolations } from '../../support/a11y-log';

describe('Accesibilidad - flujo completo de telemetria', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: {
        user: {
          ID_USUARIO: 1,
          NOMBRE: 'Natalia',
          CORREO_ELECTRONICO: 'test@test.com'
        }
      }
    }).as('login');

    cy.intercept('GET', '**/api/mis-plantas', {
      statusCode: 200,
      body: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Helecho' }]
    }).as('misPlantas');

    cy.intercept('POST', '**/api/monitorear', {
      statusCode: 200,
      body: { ok: true, id_sensor: 'TEST-SENSOR-123' }
    }).as('monitorear');

    cy.intercept('GET', '**/api/datos', {
      body: { dato: 'T:22.0, H:45.0' }
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      body: { historial: [] }
    }).as('historial');

    cy.intercept('POST', '**/api/verificar-condiciones', {
      statusCode: 200,
      body: { ok: true, mensaje: 'Verificacion exitosa' }
    }).as('verificar');

    cy.visit('http://localhost:4200/login');
  });

  it('expone login, lista y monitoreo como partes accesibles del flujo', () => {
    cy.injectAxe();

    cy.get('.form-box.login').should('be.visible');
    cy.get('input[placeholder="Correo"]').should('be.visible');
    cy.get('input[placeholder="Contraseña"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Ingresar');

    cy.checkA11y('.form-box.login', null, logA11yViolations);

    cy.get('input[placeholder="Correo"]').first().type('1001498893');
    cy.get('input[placeholder="Contraseña"]').first().type('Natalia728');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
    cy.get('button[type="submit"]').first().click();

    cy.wait('@login');
    cy.url().should('include', '/mis-plantas');
    cy.wait('@misPlantas');

    cy.injectAxe();
    cy.contains('.planta-nombre', 'Helecho').should('be.visible');
    cy.contains('button', 'Monitorear').should('be.visible');
    cy.checkA11y('.plantas-grid, .nuevas-plantas-section', null, logA11yViolations);

    cy.get('.btn-monitorear').first().click();
    cy.wait('@monitorear');
    cy.url().should('include', '/monstera?pu=1');
    cy.wait('@datos');
    cy.wait('@historial');

    cy.injectAxe();
    cy.contains('.monit-sensor-value', '22.0').should('be.visible');
    cy.contains('button', 'Verificar condiciones').should('be.visible');
    // Scope to the monitored data areas already covered by the standalone sensor accessibility spec.
    cy.checkA11y('.portada, .seccion-blanca', null, logA11yViolations);
  });
});
