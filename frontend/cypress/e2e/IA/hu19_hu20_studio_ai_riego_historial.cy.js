/// <reference types="cypress" />

describe('Cypress Studio AI - Riego manual e historial de Monstera', () => {

  beforeEach(() => {
    cy.clearLocalStorage();

    // Login controlado para acceder a las funcionalidades de Monstera.
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

    // Planta disponible para entrar al monitoreo.
    cy.intercept('GET', '**/api/mis-plantas*', {
      statusCode: 200,
      body: [
        {
          ID_PLANTA_USUARIO: 10,
          NOMBRE_COMUN: 'Monstera'
        }
      ]
    }).as('misPlantas');

    // Lecturas visibles de la pantalla.
    cy.intercept('GET', '**/api/datos*', {
      statusCode: 200,
      body: {
        dato: 'T:25.0,H:60.0%'
      }
    }).as('datosAmbientales');

    // Estado inicial del historial.
    cy.intercept('GET', '**/api/historial*', {
      statusCode: 200,
      body: {
        historial: []
      }
    }).as('historialInicial');

    // Respuesta controlada para el riego que grabará Studio AI.
    cy.intercept('POST', '**/api/regar*', {
      statusCode: 200,
      body: {
        ok: true,
        message: 'Riego activado correctamente'
      }
    }).as('regarStudioAI');
  });

  it('STUDIO-AI-ANGIE-01: prepara Monstera para validar el riego manual y el historial', () => {
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
    
    // Se evita que la alerta detenga la interacción que grabará Studio AI.
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaRiegoIA');
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
    
    cy.get('.monit-historial', { timeout: 10000 })
      .should('be.visible');
    
    cy.contains('No hay registros de riego aún')
      .should('be.visible');
    
    cy.contains('button', 'Regar ahora')
      .should('be.visible');
    
    // Desde este punto se continúa la interacción con Cypress Studio AI.
    cy.get('button:nth-child(3)').click();
    // The message 'Riego manual activado' is displayed.
    cy.get('span.history-msg')
      .should('contain.text', 'Riego manual activado')
    
  });

});