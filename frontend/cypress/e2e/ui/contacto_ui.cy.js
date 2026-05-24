/// <reference types="cypress" />

describe('UI - contacto', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/');
  });

  it('muestra el formulario y habilita el envio al completarlo', () => {
    cy.get('.footer-form-title').should('contain.text', 'Nosotros te contactamos');
    cy.get('#nombre').should('be.visible');
    cy.get('#correo').should('be.visible');
    cy.get('#mensaje').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('#nombre').type('UI User');
    cy.get('#correo').type('ui@example.com');
    cy.get('#mensaje').type('UI flow');

    cy.get('button[type="submit"]').should('not.be.disabled');
  });
});
