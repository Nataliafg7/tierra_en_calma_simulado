/// <reference types="cypress" />

describe('HU3 – Login con campos vacíos', () => {
  it('no debe iniciar sesión si los campos están vacíos', () => {
    // Ir directamente a la página de login
    cy.visit('http://localhost:4200/');

    // Abrir formulario de login si no está visible
    cy.contains('Iniciar sesión').click();

    // Verificar que los inputs estén visibles
    cy.get('.form-box.login', { timeout: 10000 }).should('be.visible');

    // Vaciar los campos por si tienen datos
    cy.get('.form-box.login').find('input[placeholder="Correo"]').clear();
    cy.get('.form-box.login').find('input[placeholder="Contraseña"]').clear();

    // Hacer clic en Ingresar
    cy.get('.form-box.login').contains('button', 'Ingresar').click();

    // Validar que no se navegue y que aparezca un error o que siga visible el formulario
    cy.get('.form-box.login').should('be.visible');
  });
});