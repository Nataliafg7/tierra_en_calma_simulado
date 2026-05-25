/// <reference types="cypress" />

describe('Seguridad - monitorear plantas', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('redirige a login cuando no hay sesion', () => {
    cy.visit('http://localhost:4200/mis-plantas');

    cy.url().should('include', '/login');
    cy.get('.form-box.login').should('be.visible');
  });
});
