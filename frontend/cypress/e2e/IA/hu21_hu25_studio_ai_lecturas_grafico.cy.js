/// <reference types="cypress" />

describe('Cypress Studio AI - Lecturas ambientales de Monstera', () => {

  beforeEach(() => {
    cy.clearLocalStorage();

    // =============================
    // LOGIN CONTROLADO
    // =============================
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

    // =============================
    // PLANTA DISPONIBLE EN MIS PLANTAS
    // =============================
    cy.intercept('GET', '**/api/mis-plantas*', {
      statusCode: 200,
      body: [
        {
          ID_PLANTA_USUARIO: 10,
          NOMBRE_COMUN: 'Monstera'
        }
      ]
    }).as('misPlantas');

    // =============================
    // ACCESO AL MONITOREO
    // =============================
    cy.intercept('POST', '**/api/monitorear', {
      statusCode: 200,
      body: {
        ok: true,
        id_sensor: 100
      }
    }).as('monitorearStudioAI');

    // =============================
    // HU21 - LECTURAS AMBIENTALES
    // =============================
    cy.intercept('GET', '**/api/datos*', {
      statusCode: 200,
      body: {
        dato: 'T:25.0,H:60.0%'
      }
    }).as('datosAmbientales');

    // =============================
    // HISTORIAL INICIAL
    // =============================
    cy.intercept('GET', '**/api/historial*', {
      statusCode: 200,
      body: {
        historial: []
      }
    }).as('historialInicial');
  });

  it('STUDIO-AI-ANGIE-03: valida las lecturas ambientales con aserciones sugeridas por IA', () => {

    // =============================
    // INICIAR SESIÓN
    // =============================
    cy.visit('/');

    cy.contains('Iniciar sesión')
      .should('be.visible')
      .click();

    cy.get('.form-box.login', { timeout: 10000 })
      .should('be.visible');

    cy.get('input[name="loginCorreo"]')
      .should('be.visible')
      .type('adiazabaunza@gmail.com');

    cy.get('input[name="loginContrasena"]')
      .should('be.visible')
      .type('AngieAbaunza');

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaLecturasIA');
    });

    cy.get('.form-box.login button[type="submit"]')
      .should('be.visible')
      .click({ force: true });

    cy.wait('@login');

    // =============================
    // INTERACCIÓN GRABADA CON STUDIO AI
    // =============================
    cy.contains('button', 'Monitorear', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click();

    cy.wait('@monitorearStudioAI');

    cy.url()
      .should('include', '/monstera');

    // ==========================================================
    // ASERCIONES INCORPORADAS A PARTIR DE CYPRESS STUDIO AI
    // Recomendaciones aceptadas:
    // "The temperature reading is visible."
    // "The soil humidity reading is visible."
    // ==========================================================
    cy.get('.monit-sensor-value', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'Temperatura:')
      .and('contain.text', '25.0 °C')
      .and('contain.text', 'Humedad del suelo:')
      .and('contain.text', '60.0%');

    cy.get('.status-chip')
      .should('be.visible')
      .and('contain.text', 'Conectado');
  });

});