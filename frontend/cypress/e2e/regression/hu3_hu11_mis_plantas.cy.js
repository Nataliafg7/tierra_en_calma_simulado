/// <reference types="cypress" />

describe('HU3-HU11 y flujo de mis plantas', () => {
  it('debe iniciar sesión correctamente y mostrar todas las plantas del usuario', () => {
    const correo = 'usuarioPrueba@gmail.com';
    const contrasena = 'Pruebapruebita';

    // Interceptar login
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { message: 'Login exitoso', userId: 1 }
    }).as('login');

    // Interceptar petición de plantas
    cy.intercept('GET', '/api/plantas?userId=1', {
      statusCode: 200,
      body: [
        { id: 1, nombre: 'Monstera', especie: 'Monstera Deliciosa' },
        { id: 2, nombre: 'Ficus', especie: 'Ficus Lyrata' }
      ]
    }).as('getPlantas');

    // Ir a la página de login
    cy.visit('http://localhost:4200/');
    cy.contains('Iniciar sesión').click();

    // Llenar inputs de login
    cy.get('.form-box.login input[placeholder="Correo"]').should('be.visible').type(correo);
    cy.get('.form-box.login input[placeholder="Contraseña"]').should('be.visible').type(contrasena);

    // Hacer submit del formulario
    cy.get('.form-box.login form').submit();

    // Esperar a que Angular haga el login
    cy.wait('@login');

    // Esperar a que se carguen las plantas
    cy.wait('@getPlantas');

    // Validar que las plantas se muestren
    cy.get('.plant-card', { timeout: 10000 }).should('have.length', 2);
    cy.contains('Monstera');
    cy.contains('Ficus');
  });
});