/// <reference types="cypress" />

describe('Seguridad - flujo completo de telemetria', () => {
  it('no permite avanzar con credenciales invalidas', () => {
    cy.intercept('POST', '**/api/login', {
      statusCode: 401,
      body: { message: 'Credenciales invalidas' }
    }).as('login');

    cy.visit('http://localhost:4200/login');
    cy.get('input[placeholder="Correo"]').first().type('mal@example.com');
    cy.get('input[placeholder="Contraseña"]').first().type('wrong');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });

    cy.get('button[type="submit"]').first().click();
    cy.wait('@login');

    cy.url().should('not.include', '/mis-plantas');
    cy.get('@alerta').should('have.been.called');
  });
});
