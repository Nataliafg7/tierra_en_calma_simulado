/// <reference types="cypress" />

describe('HU1 - Registro exitoso de usuario', () => {
  it('debe registrar un usuario correctamente', () => {
    const numero = Date.now();
    const correo = `prueba${numero}@gmail.com`;

    // Interceptar la petición de registro
    cy.intercept('POST', '/api/register', {
      statusCode: 200,
      body: { message: 'Usuario registrado con éxito.' }
    }).as('register');

    // Ir a la página principal
    cy.visit('http://localhost:4200/');

    // Abrir formulario de registro
    cy.contains('Regístrate').click();

    // Esperar que el formulario esté visible
    cy.get('.form-box.register', { timeout: 10000 }).should('be.visible');

    // Llenar el formulario solo dentro del registro
    cy.get('.form-box.register').find('input[placeholder="Identificación"]').type(String(numero).slice(-10));
    cy.get('.form-box.register').find('input[placeholder="Nombre"]').type('Prueba');
    cy.get('.form-box.register').find('input[placeholder="Apellido"]').type('Playwright');
    cy.get('.form-box.register').find('input[placeholder="Teléfono"]').type('3127765569');
    cy.get('.form-box.register').find('input[placeholder="Correo"]').type(correo);
    cy.get('.form-box.register').find('input[placeholder="Contraseña"]').type('Pruebapruebita');

    // Hacer clic en Registrar
    cy.get('.form-box.register').contains('button', 'Registrar').click();

    // Esperar la petición de registro
    cy.wait('@register');

    // Validar alerta de éxito
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Usuario registrado');
    });
  });
});