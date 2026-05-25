/// <reference types="cypress" />

describe('Seguridad - contacto', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/');
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alerta');
    });
  });

  it('trata contenido sospechoso como texto plano', () => {
    cy.intercept('POST', '**/api/contacto', (req) => {
      expect(req.body.nombre).to.contain('<script>');
      expect(req.body.mensaje).to.contain('onerror=alert(1)');

      req.reply({
        statusCode: 200,
        body: { message: 'Mensaje enviado' }
      });
    }).as('contacto');

    cy.get('#nombre').type('<script>alert(1)</script>');
    cy.get('#correo').type('evil@example.com');
    cy.get('#mensaje').type('<img src=x onerror=alert(1)>');
    cy.get('button[type="submit"]').click();

    cy.wait('@contacto');
    cy.get('@alerta').should(
      'have.been.calledWith',
      'Gracias <script>alert(1)</script>, tu mensaje fue enviado correctamente.'
    );
  });
});
