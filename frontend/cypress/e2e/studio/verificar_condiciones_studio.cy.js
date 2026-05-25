/// <reference types="cypress" />

describe('Studio - verificar condiciones', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/datos', {
      body: { dato: 'T:25.0, H:60.0' }
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      body: { historial: [] }
    }).as('historial');

    cy.intercept('POST', '**/api/verificar-condiciones', {
      statusCode: 200,
      body: { ok: true, mensaje: 'Verificacion exitosa' }
    }).as('verificar');

    cy.visit('http://localhost:4200/monstera?pu=1');
    cy.wait('@datos');
    cy.wait('@historial');

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
  });

  it('recorre la verificacion manual con una alerta clara', () => {
    cy.contains('button', 'Verificar condiciones').click();
    cy.wait('@verificar');
    cy.get('@alerta').should('have.been.calledWith', 'Verificacion exitosa');
  });
});
