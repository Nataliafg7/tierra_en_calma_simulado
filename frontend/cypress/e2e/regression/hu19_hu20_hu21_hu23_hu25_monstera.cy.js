/// <reference types="cypress" />

describe('Regresión - Flujo completo Monstera HU19, HU20, HU21, HU23 y HU25', () => {

  beforeEach(() => {
    cy.clearLocalStorage();

    // =============================
    // LOGIN
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
    // LISTADO DE PLANTAS
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
    // HU21 - DATOS DEL SENSOR
    // =============================
    cy.intercept('GET', '**/api/datos*', {
      statusCode: 200,
      body: {
        dato: 'T:25.0,H:60.0%'
      }
    }).as('datosAmbientales');

    // =============================
    // HU20 - HISTORIAL DE RIEGO
    // =============================
    cy.intercept('GET', '**/api/historial*', {
      statusCode: 200,
      body: {
        historial: []
      }
    }).as('historialBackend');

    // =============================
    // HU19 - RIEGO MANUAL
    // =============================
    cy.intercept('POST', '**/api/regar*', {
      statusCode: 200,
      body: {
        ok: true,
        message: 'Riego activado correctamente'
      }
    }).as('regar');

    // =============================
    // HU23 - REGISTRO DE CUIDADOS
    // =============================
    cy.intercept('POST', '**/api/cuidados', {
      statusCode: 200,
      body: {
        ok: true,
        message: 'Cuidado registrado con éxito'
      }
    }).as('guardarCuidado');

    // =============================
    // HU25 - VERIFICACIÓN DE CONDICIONES
    // =============================
    cy.intercept('POST', '**/api/verificar-condiciones', {
      statusCode: 200,
      body: {
        ok: true,
        mensaje: 'Condiciones óptimas'
      }
    }).as('verificarCondiciones');
  });

  it('REG-ANGIE-01: ejecuta correctamente el flujo de monitoreo y cuidado de Monstera', () => {

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
      cy.stub(win, 'alert').as('alertaGeneral');
    });

    cy.get('.form-box.login button[type="submit"]')
      .should('be.visible')
      .click({ force: true });

    cy.wait('@login');

    // =============================
    // INGRESAR AL MONITOREO DE MONSTERA
    // =============================
    cy.contains('button', 'Monitorear', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click();

    cy.url()
      .should('include', '/monstera');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('planta_usuario_id')).to.exist;
    });

    // =============================
    // HU21 - ACTUALIZACIÓN DE LECTURAS AMBIENTALES
    // =============================
    cy.get('.monit-sensor-value', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'Temperatura:')
      .and('contain.text', '25.0 °C')
      .and('contain.text', 'Humedad del suelo:')
      .and('contain.text', '60.0%');

    cy.get('.status-chip')
      .should('be.visible')
      .and('contain.text', 'Conectado');

    // =============================
    // HU25 - GENERACIÓN DEL GRÁFICO
    // =============================
    cy.contains('Humedad vs Temperatura')
      .should('be.visible');

    cy.get('.monit-chart canvas')
      .should('exist')
      .and('be.visible');

    // =============================
    // HU19 - SIMULACIÓN DE RIEGO MANUAL
    // =============================
    cy.contains('button', 'Regar ahora')
      .should('be.visible')
      .click();

    cy.wait('@regar');

    cy.get('@alertaGeneral')
      .should('have.been.calledWith', 'Riego activado correctamente');

    // =============================
    // HU20 - REGISTRO AUTOMÁTICO DEL EVENTO EN HISTORIAL
    // =============================
    cy.get('.monit-history-list')
      .should('be.visible');

    cy.get('.history-item')
      .should('have.length.at.least', 1);

    cy.get('.history-msg')
      .first()
      .should('contain.text', 'Riego manual activado');

    // =============================
    // HU23 - REGISTRO DE CUIDADOS
    // =============================
    cy.get('#fecha')
      .should('be.visible')
      .type('2026-04-03');

    cy.get('#tipo')
      .should('be.visible')
      .select('poda');

    cy.get('#detalles')
      .should('be.visible')
      .type('Retiro de hojas secas');

    cy.get('.btn-guardar')
      .should('be.visible')
      .click();

    cy.wait('@guardarCuidado');

    cy.get('@alertaGeneral')
      .should('have.been.calledWith', 'Cuidado guardado:\npoda el 2026-04-03');

    // El formulario debe quedar limpio después de guardar.
    cy.get('#fecha')
      .should('have.value', '');

    cy.get('#tipo')
      .should('have.value', null);

    cy.get('#detalles')
      .should('have.value', '');

    // =============================
    // HU25 - VERIFICACIÓN DE CONDICIONES
    // =============================
    cy.contains('button', 'Verificar condiciones')
      .should('be.visible')
      .click();

    cy.wait('@verificarCondiciones');

    cy.get('@alertaGeneral')
      .should('have.been.calledWith', 'Condiciones óptimas');
  });

});