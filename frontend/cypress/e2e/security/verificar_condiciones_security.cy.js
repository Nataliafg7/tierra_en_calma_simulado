/// <reference types="cypress" />

describe('Seguridad - verificar condiciones', () => {
  it('no llama al backend si no existe planta seleccionada', () => {
    let verificarCalls = 0;

    cy.intercept('POST', '**/api/verificar-condiciones', (req) => {
      verificarCalls += 1;
      req.reply({
        statusCode: 200,
        body: { ok: true, mensaje: 'No deberia ejecutarse' }
      });
    }).as('verificar');

    cy.visit('http://localhost:4200/monstera');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
    cy.contains('button', 'Verificar condiciones').click();

    cy.get('@alerta').should('have.been.calledWith', 'Falta ID de planta');
    cy.then(() => {
      expect(verificarCalls).to.eq(0);
    });
  });
});
