/// <reference types="cypress" />

describe('Accesibilidad - contacto', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/');
  });

  it('expone etiquetas y controles correctamente', () => {
    cy.injectAxe();

    cy.get('footer#footer').should('be.visible');
    cy.get('.footer-form-title').should('contain.text', 'Nosotros te contactamos');
    cy.get('label[for="nombre"]').should('be.visible');
    cy.get('#nombre').should('have.attr', 'type', 'text');
    cy.get('label[for="correo"]').should('be.visible');
    cy.get('#correo').should('have.attr', 'type', 'email');
    cy.get('label[for="mensaje"]').should('be.visible');
    cy.get('#mensaje').should('be.visible');

    cy.checkA11y('footer#footer');
  });
});
