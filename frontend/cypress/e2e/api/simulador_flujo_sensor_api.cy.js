/// <reference types="cypress" />

describe('API - flujo completo de telemetria', () => {
  it('encadena login, monitoreo, lecturas y verificacion', () => {
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
      statusCode: 200,
      body: { dato: 'T:22.0, H:45.0' }
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      statusCode: 200,
      body: { historial: [] }
    }).as('historial');

    cy.intercept('POST', '**/api/verificar-condiciones', {
      statusCode: 200,
      body: { ok: true, mensaje: 'Verificacion exitosa' }
    }).as('verificar');

    cy.visit('http://localhost:4200/login');
    cy.get('input[placeholder="Correo"]').first().type('1001498893');
    cy.get('input[placeholder="Contraseña"]').first().type('Natalia728');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
    cy.get('button[type="submit"]').first().click();

    cy.wait('@login');
    cy.url().should('include', '/mis-plantas');
    cy.wait('@misPlantas');

    cy.contains('Helecho').should('be.visible');
    cy.get('.btn-monitorear').first().click();
    cy.wait('@monitorear');

    cy.url().should('include', '/monstera?pu=1');
    cy.wait('@datos');
    cy.wait('@historial');

    cy.contains('.monit-sensor-value', '22.0').should('be.visible');
    cy.contains('.monit-sensor-value', '45.0').should('be.visible');

    cy.contains('button', 'Verificar condiciones').click();
    cy.wait('@verificar');
    cy.get('@alerta').should('have.been.calledWith', 'Verificacion exitosa');
  });
});
