/// <reference types="cypress" />
import 'cypress-axe';

describe('Accesibilidad - Pantalla de monitoreo y cuidado de Monstera', () => {

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
    // HU21 - DATOS AMBIENTALES
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
  });

  it('A11Y-ANGIE-01: analiza la accesibilidad de la pantalla Monstera', () => {

    // =============================
    // INICIAR SESIÓN
    // =============================
    cy.visit('/');

    cy.contains('Iniciar sesión')
      .should('be.visible')
      .click();

    cy.get('input[name="loginCorreo"]')
      .should('be.visible')
      .type('adiazabaunza@gmail.com');

    cy.get('input[name="loginContrasena"]')
      .should('be.visible')
      .type('AngieAbaunza');

    cy.window().then((win) => {
      cy.stub(win, 'alert');
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

    cy.get('.portada', { timeout: 10000 })
      .should('be.visible');

    // =============================
    // VALIDAR QUE LA PANTALLA CARGÓ
    // =============================

    cy.get('.monit-sensor-value')
      .should('be.visible')
      .and('contain.text', 'Temperatura:')
      .and('contain.text', 'Humedad del suelo:');

    cy.get('.status-chip')
      .should('be.visible')
      .and('contain.text', 'Conectado');

    cy.get('.monit-historial')
      .should('be.visible');

    cy.contains('button', 'Regar ahora')
      .should('be.visible');

    cy.contains('button', 'Verificar condiciones')
      .should('be.visible');

    cy.get('.monit-chart canvas')
      .should('exist')
      .and('be.visible');

    cy.get('.cuidados-form')
      .should('be.visible');

    // =============================
    // ANÁLISIS AUTOMATIZADO CON AXE
    // =============================
    cy.injectAxe();

    cy.checkA11y(
      undefined,
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      },
      (violations) => {
        const evidencia = {
          prueba: 'A11Y-ANGIE-01',
          pantalla: 'Monstera - monitoreo y cuidado',
          historiasUsuario: ['HU19', 'HU20', 'HU21', 'HU23', 'HU25'],
          herramienta: 'Cypress con cypress-axe',
          estandarEvaluado: ['WCAG 2.0 A', 'WCAG 2.0 AA'],
          totalHallazgos: violations.length,
          hallazgos: violations.map((violation) => ({
            id: violation.id,
            impacto: violation.impact,
            descripcion: violation.description,
            ayuda: violation.help,
            referencia: violation.helpUrl,
            elementosAfectados: violation.nodes.length,
            selectores: violation.nodes.map((node) => node.target),
            resumenFalla: violation.nodes.map((node) => node.failureSummary)
          }))
        };

        cy.log(`Hallazgos detectados en Monstera: ${violations.length}`);

        violations.forEach((violation) => {
          cy.log(
            `${violation.id} - Impacto: ${violation.impact} - Elementos afectados: ${violation.nodes.length}`
          );
        });

        cy.writeFile(
          'cypress/evidencias/accesibilidad/a11y_monstera.json',
          evidencia
        );
      },

      // Permite documentar hallazgos sin detener la prueba.
      true
    );

    // =============================
    // VALIDAR QUE LA EVIDENCIA FUE GENERADA
    // =============================
    cy.readFile('cypress/evidencias/accesibilidad/a11y_monstera.json')
      .then((evidencia) => {
        expect(evidencia.prueba).to.eq('A11Y-ANGIE-01');
        expect(evidencia.pantalla).to.eq('Monstera - monitoreo y cuidado');
        expect(evidencia.totalHallazgos).to.be.a('number');
        expect(evidencia.hallazgos).to.be.an('array');
      });
  });

});