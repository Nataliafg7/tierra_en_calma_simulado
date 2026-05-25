/// <reference types="cypress" />

describe('Studio - contacto', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
  });

  it('recorre el envio basico del formulario', () => {
    cy.intercept('POST', '**/api/contacto', {
      statusCode: 200,
      body: { message: 'Mensaje enviado' }
    }).as('contacto');

    cy.get('#nombre').type('Studio User');
    cy.get('#correo').type('studio@example.com');
    cy.get('#mensaje').type('Mensaje de prueba');
    cy.get('button[type="submit"]').click();

    cy.wait('@contacto');
    cy.get('@alerta').should(
      'have.been.calledWith',
      'Gracias Studio User, tu mensaje fue enviado correctamente.'
    );
  });
});
