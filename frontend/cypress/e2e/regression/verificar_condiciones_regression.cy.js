/// <reference types="cypress" />

describe('Regresion - verificar condiciones', () => {
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

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
  });

  it('mantiene la alerta de condiciones optimas', () => {
    cy.intercept('POST', '**/api/verificar-condiciones', {
      statusCode: 200,
      body: { ok: true, mensaje: 'Condiciones optimas. No se requiere riego.' }
    }).as('verificar');

    cy.contains('button', 'Verificar condiciones').click();
    cy.wait('@verificar');

    cy.get('@alerta').should(
      'have.been.calledWith',
      'Condiciones optimas. No se requiere riego.'
    );
  });
});
