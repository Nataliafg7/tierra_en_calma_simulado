/// <reference types="cypress" />

describe('UI - Pantalla de monitoreo y cuidado de Monstera', () => {

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: {
        user: {
          ID_USUARIO: 1,
          NOMBRE: 'Angie',
          CORREO_ELECTRONICO: 'adiazabaunza@gmail.com'
        }
      }
    }).as('login');

    cy.intercept('GET', '**/api/mis-plantas*', {
      statusCode: 200,
      body: [
        {
          ID_PLANTA_USUARIO: 10,
          NOMBRE_COMUN: 'Monstera'
        }
      ]
    }).as('misPlantas');

    cy.intercept('GET', '**/api/datos*', {
      statusCode: 200,
      body: {
        dato: 'T:25.0,H:60.0%'
      }
    }).as('datosAmbientales');

    cy.intercept('GET', '**/api/historial*', {
      statusCode: 200,
      body: {
        historial: []
      }
    }).as('historialBackend');
  });

  it('UI-ANGIE-01: muestra correctamente los elementos principales de la pantalla Monstera', () => {

    // Iniciar sesión para acceder a la planta.
    cy.visit('/');

    cy.contains('Iniciar sesión')
      .should('be.visible')
      .click();

    cy.get('input[name="loginCorreo"]')
      .type('adiazabaunza@gmail.com');

    cy.get('input[name="loginContrasena"]')
      .type('AngieAbaunza');

    cy.window().then((win) => {
      cy.stub(win, 'alert');
    });

    cy.get('.form-box.login button[type="submit"]')
      .click({ force: true });

    cy.wait('@login');

    cy.contains('button', 'Monitorear', { timeout: 10000 })
      .first()
      .click();

    cy.url()
      .should('include', '/monstera');

    // HU21 - Panel de lecturas ambientales.
    cy.get('.monit-sensor-value')
      .should('be.visible')
      .and('contain.text', 'Temperatura:')
      .and('contain.text', '25.0 °C')
      .and('contain.text', 'Humedad del suelo:')
      .and('contain.text', '60.0%');

    cy.get('.status-chip')
      .should('be.visible')
      .and('contain.text', 'Conectado');

    // HU20 - Área visual del historial de riego.
    cy.contains('Historial de')
      .should('be.visible');

    cy.get('.monit-historial')
      .should('be.visible');

    cy.contains('No hay registros de riego aún')
      .should('be.visible');

    // HU19 - Controles de riego.
    cy.contains('button', 'Regar ahora')
      .should('be.visible');

    cy.contains('button', 'Verificar condiciones')
      .should('be.visible');

    // HU25 - Área gráfica.
    cy.contains('Humedad vs Temperatura')
      .should('be.visible');

    cy.get('.monit-chart canvas')
      .should('exist')
      .and('be.visible');

    // HU23 - Formulario de registro de cuidados.
    cy.contains('Registrar')
      .should('be.visible');

    cy.get('.cuidados-form')
      .should('be.visible');

    cy.get('#fecha')
      .should('be.visible');

    cy.get('#tipo')
      .should('be.visible');

    cy.get('#detalles')
      .should('be.visible');

    cy.get('.btn-guardar')
      .should('be.visible')
      .and('contain.text', 'Guardar cuidado');
  });

});