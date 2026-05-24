/// <reference types="cypress" />

describe('Seguridad - Controles de integridad y protección de acciones en Monstera', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  function configurarAccesoMonstera(datoSensor = 'T:25.0,H:60.0%') {
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
    // DATOS AMBIENTALES
    // =============================
    cy.intercept('GET', '**/api/datos*', {
      statusCode: 200,
      body: {
        dato: datoSensor
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
    }).as('historialBackend');
  }

  function iniciarSesionYAbrirMonstera() {
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
      cy.stub(win, 'alert').as('alertaSeguridad');
    });

    cy.get('.form-box.login button[type="submit"]')
      .should('be.visible')
      .click({ force: true });

    cy.wait('@login');

    cy.contains('button', 'Monitorear', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click();

    cy.url()
      .should('include', '/monstera');

    cy.get('.portada', { timeout: 10000 })
      .should('be.visible');
  }

  it('SEC-ANGIE-01: no registra un evento de riego cuando la activación manual falla - HU19 y HU20', () => {
    configurarAccesoMonstera();

    cy.intercept('POST', '**/api/regar*', {
      statusCode: 500,
      body: {
        message: 'Error al activar el riego'
      }
    }).as('riegoFallido');

    iniciarSesionYAbrirMonstera();

    cy.contains('button', 'Regar ahora')
      .should('be.visible')
      .click();

    cy.wait('@riegoFallido');

    // HU19: no debe informar éxito si el servicio falla.
    cy.get('@alertaSeguridad')
      .should('have.been.calledWith', 'Error al activar el riego');

    cy.get('@alertaSeguridad')
      .should('not.have.been.calledWith', 'Riego activado correctamente');

    // HU20: no debe crear un registro falso en el historial.
    cy.get('.history-item')
      .should('not.exist');

    cy.contains('No hay registros de riego aún')
      .should('be.visible');
  });

  it('SEC-ANGIE-02: no interpreta contenido malicioso como lectura ambiental válida - HU21', () => {
    const datoMalicioso = '<img src=x onerror="window.sensorHack=true">';

    configurarAccesoMonstera(datoMalicioso);

    iniciarSesionYAbrirMonstera();

    cy.get('.monit-sensor-value', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'Temperatura:')
      .and('contain.text', 'Humedad del suelo:')
      .and('contain.text', '---')
      .and('not.contain.text', '<img');

    cy.window().then((win) => {
      expect(win.sensorHack).to.be.undefined;
    });
  });

  it('SEC-ANGIE-03: bloquea el envío del cuidado cuando falta la fecha obligatoria - HU23', () => {
    let solicitudesCuidados = 0;

    configurarAccesoMonstera();

    cy.intercept('POST', '**/api/cuidados', (request) => {
      solicitudesCuidados += 1;

      request.reply({
        statusCode: 200,
        body: {
          ok: true,
          message: 'Cuidado registrado con éxito'
        }
      });
    }).as('guardarCuidadoSinFecha');

    iniciarSesionYAbrirMonstera();

    cy.get('#tipo')
      .should('be.visible')
      .select('poda');

    cy.get('#detalles')
      .should('be.visible')
      .type('Retiro de hojas secas');

    cy.get('.btn-guardar')
      .should('be.visible')
      .click();

    cy.get('@alertaSeguridad')
      .should('have.been.calledWith', 'Falta fecha (YYYY-MM-DD)');

    cy.then(() => {
      expect(solicitudesCuidados).to.eq(0);
    });
  });

  it('SEC-ANGIE-04: bloquea el envío del cuidado cuando falta el tipo obligatorio - HU23', () => {
    let solicitudesCuidados = 0;

    configurarAccesoMonstera();

    cy.intercept('POST', '**/api/cuidados', (request) => {
      solicitudesCuidados += 1;

      request.reply({
        statusCode: 200,
        body: {
          ok: true,
          message: 'Cuidado registrado con éxito'
        }
      });
    }).as('guardarCuidadoSinTipo');

    iniciarSesionYAbrirMonstera();

    cy.get('#fecha')
      .should('be.visible')
      .type('2026-04-03');

    cy.get('#detalles')
      .should('be.visible')
      .type('Retiro de hojas secas');

    cy.get('.btn-guardar')
      .should('be.visible')
      .click();

    cy.get('@alertaSeguridad')
      .should('have.been.calledWith', 'Falta tipo de cuidado');

    cy.then(() => {
      expect(solicitudesCuidados).to.eq(0);
    });
  });

  it('SEC-ANGIE-05: impide verificar condiciones cuando no hay planta seleccionada - HU25', () => {
    let solicitudesVerificacion = 0;

    cy.intercept('GET', '**/api/datos*', {
      statusCode: 200,
      body: {
        dato: 'T:25.0,H:60.0%'
      }
    }).as('datosSinPlanta');

    cy.intercept('GET', '**/api/historial*', {
      statusCode: 200,
      body: {
        historial: []
      }
    }).as('historialSinPlanta');

    cy.intercept('POST', '**/api/verificar-condiciones', (request) => {
      solicitudesVerificacion += 1;

      request.reply({
        statusCode: 200,
        body: {
          ok: true,
          mensaje: 'Condiciones óptimas'
        }
      });
    }).as('verificacionSinPlanta');

    cy.visit('/monstera');

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaSinPlanta');
    });

    cy.contains('button', 'Verificar condiciones', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.get('@alertaSinPlanta')
      .should('have.been.calledWith', 'Falta ID de planta');

    cy.then(() => {
      expect(solicitudesVerificacion).to.eq(0);
    });
  });

});