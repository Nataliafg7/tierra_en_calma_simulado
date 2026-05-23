/// <reference types="cypress" />

describe('HU1 - Registro exitoso de usuario', () => {
  it('debe registrar un usuario correctamente', () => {
    const numero = Date.now();
    const correo = `prueba${numero}@gmail.com`;

    // Interceptar la petición de registro y simular respuesta exitosa
    cy.intercept('POST', '/api/register', {
      statusCode: 200,
      body: { message: 'Usuario registrado con éxito.' }
    }).as('register');

    // Visitar la página principal
    cy.visit('http://localhost:4200/');

    // Navegar al formulario de registro
    cy.contains('Iniciar sesión').click();
    cy.contains('Regístrate').click();

    // Llenar el formulario
    cy.get('input[aria-label="Identificación"]').type(String(numero).slice(-10));
    cy.get('input[aria-label="Nombre"]').type('Prueba');
    cy.get('input[aria-label="Apellido"]').type('Playwright');
    cy.get('input[aria-label="Teléfono"]').type('3127765569');
    cy.get('input[aria-label="Correo"]').type(correo);
    cy.get('input[aria-label="Contraseña"]').type('Pruebapruebita');

    // Hacer clic en registrar
    cy.contains('Registrar').click();

    // Validar la alerta de éxito
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Usuario registrado');
    });

    // Esperar la petición interceptada
    cy.wait('@register');
  });
});