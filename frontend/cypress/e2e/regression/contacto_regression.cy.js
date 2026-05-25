/// <reference types="cypress" />

describe('Regresion - contacto', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
  });

  it('mantiene el flujo exitoso de envio', () => {
    cy.intercept('POST', '**/api/contacto', {
      statusCode: 200,
      body: { message: 'Mensaje enviado' }
    }).as('contacto');

    cy.get('#nombre').type('Test User');
    cy.get('#correo').type('test@example.com');
    cy.get('#mensaje').type('Prueba E2E');
    cy.get('button[type="submit"]').click();

    cy.wait('@contacto');
    cy.get('@alerta').should(
      'have.been.calledWith',
      'Gracias Test User, tu mensaje fue enviado correctamente.'
    );
  });
});
