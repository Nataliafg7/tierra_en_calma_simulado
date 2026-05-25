/// <reference types="cypress" />

describe('Cypress Studio AI - Registro de cuidados de Monstera', () => {

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
    // PLANTA DISPONIBLE
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
    // LECTURAS AMBIENTALES
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

    // =============================
    // HU23 - REGISTRO EXITOSO DE CUIDADO
    // =============================
    cy.intercept('POST', '**/api/cuidados', {
      statusCode: 201,
      body: {
        id_cuidado: 25,
        id_riego: null
      }
    }).as('guardarCuidadoStudioAI');
  });

  it('STUDIO-AI-ANGIE-02: valida el registro de cuidado con aserción sugerida por IA', () => {

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

    // Controlar la alerta de confirmación para que no bloquee la ejecución.
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaCuidadoIA');
    });

    cy.get('.form-box.login button[type="submit"]')
      .should('be.visible')
      .click({ force: true });

    cy.wait('@login');

    // =============================
    // INGRESAR A MONITOREO DE MONSTERA
    // =============================
    cy.contains('button', 'Monitorear', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click();

    cy.url()
      .should('include', '/monstera');

    // =============================
    // UBICAR FORMULARIO DE CUIDADOS
    // =============================
    cy.get('.cuidados-form', { timeout: 10000 })
      .scrollIntoView()
      .should('be.visible');

    cy.get('#fecha')
      .should('be.visible')
      .and('have.value', '');

    cy.get('#tipo')
      .should('be.visible');

    cy.get('#detalles')
      .should('be.visible')
      .and('have.value', '');

    cy.get('.btn-guardar')
      .should('be.visible')
      .and('contain.text', 'Guardar cuidado');

    // =============================
    // INTERACCIÓN GRABADA PARA HU23
    // =============================
    cy.get('#fecha')
      .type('2026-04-03');

    cy.get('#tipo')
      .select('poda');

    cy.get('#detalles')
      .type('Retiro de hojas secas');

    cy.get('.btn-guardar')
      .click();

    cy.wait('@guardarCuidadoStudioAI');

    // Confirmar que la operación de guardado fue realizada.
    cy.get('@alertaCuidadoIA')
      .should('have.been.calledWith', 'Cuidado guardado:\npoda el 2026-04-03');

    // ==========================================================
    // ASERCIÓN INCORPORADA A PARTIR DE CYPRESS STUDIO AI
    // Recomendación aceptada:
    // "The details textarea has been cleared."
    // ==========================================================
    cy.get('#detalles')
      .should('have.value', '');
  });

});