/// <reference types="cypress" />

describe('HU11 – Navegación Mis Plantas → Registrar Plantas', () => {
  it('debe navegar automáticamente a Registrar Plantas y validar la sección', () => {
    const correo = 'jjuliana@gmail.com';
    const contrasena = 'Casasjuliana28';

    // Interceptar login
    cy.intercept('POST', '**/api/login').as('login');

    // 1. LOGIN
    cy.visit('http://localhost:4200/');
    cy.contains('Iniciar sesión').click();
    cy.get('input[placeholder="Correo"]').first().type(correo);
    cy.get('input[placeholder="Contraseña"]').first().type(contrasena);
    cy.get('button[type="submit"]').first().click();
    cy.wait('@login').its('response.statusCode').should('eq', 200);

    // 2. Validar que estamos en Mis Plantas
    cy.get('.planta-card', { timeout: 10000 }).should('exist');

    // 3. Navegar a Registrar Plantas
    cy.contains(/Registrar plantas/i, { timeout: 10000 }).click({ force: true });
    cy.url({ timeout: 10000 }).should('include', '/registrar-plantas');

    // 4. Validar que la sección de agregar plantas está visible
    cy.get('.btn-anadir', { timeout: 10000 }).should('be.visible');
  });
});