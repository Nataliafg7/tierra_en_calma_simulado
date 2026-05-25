/// <reference types="cypress" />

describe('API - contacto', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
  });

  it('envia el payload correcto y limpia el formulario', () => {
    cy.intercept('POST', '**/api/contacto', (req) => {
      expect(req.body).to.deep.equal({
        nombre: 'Test User',
        correo: 'test@example.com',
        mensaje: 'Prueba E2E'
      });

      req.reply({
        statusCode: 200,
        body: { message: 'Mensaje enviado' }
      });
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
    cy.get('#nombre').should('have.value', '');
    cy.get('#correo').should('have.value', '');
    cy.get('#mensaje').should('have.value', '');
  });
});
