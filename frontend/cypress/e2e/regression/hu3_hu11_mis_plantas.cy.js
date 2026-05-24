/// <reference types="cypress" />

describe('HU3-HU11 y flujo de mis plantas (usuario real)', () => {
  it('debe iniciar sesión correctamente y mostrar todas las plantas del usuario', () => {
    const correo = 'jjuliana@gmail.com';
    const contrasena = 'Casasjuliana28';

    cy.visit('http://localhost:4200/');
    cy.contains('Iniciar sesión').click();

    cy.get('.form-box.login input[placeholder="Correo"]').should('be.visible').type(correo);
    cy.get('.form-box.login input[placeholder="Contraseña"]').should('be.visible').type(contrasena);
    cy.get('.form-box.login button[type="submit"]').click({ force: true });

    cy.url({ timeout: 10000 }).should('include', '/mis-plantas');

    // Validar que haya al menos una planta visible
    cy.get('.planta-card', { timeout: 10000 }).should('have.length.at.least', 1);

    // Validar nombres de plantas existentes
    cy.get('.planta-nombre').contains('Palma Areca');
  });
});