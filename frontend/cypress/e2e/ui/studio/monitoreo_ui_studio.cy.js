/// <reference types="cypress" />

// Spec pensada para abrirse en Cypress Studio / Studio AI.
// Mantiene el flujo real del módulo UI para que Studio pueda grabar,
// sugerir aserciones y guardar el test en este mismo archivo.
describe('UI Studio - flujo de monitoreo', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: {
        user: {
          ID_USUARIO: 1,
          NOMBRE: 'Natalia',
          CORREO_ELECTRONICO: 'test@test.com'
        }
      }
    }).as('login');

    cy.intercept('GET', '**/api/mis-plantas', {
      statusCode: 200,
      body: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Helecho' }]
    }).as('misPlantas');

    cy.intercept('POST', '**/api/monitorear', {
      statusCode: 200,
      body: { ok: true, id_sensor: 'TEST-SENSOR-123' }
    }).as('monitorear');

    cy.intercept('GET', '**/api/datos', {
      body: { dato: 'T:22.0, H:45.0' }
    }).as('datos');

    cy.intercept('GET', '**/api/historial', {
      body: { historial: [] }
    }).as('historial');

    cy.visit('http://localhost:4200/login');
  });

  it('recorre login, mis plantas y monitoreo', () => {
    cy.get('.form-box.login').should('be.visible');
    cy.get('input[placeholder="Correo"]').first().type('1001498893');
    cy.get('input[placeholder="Contraseña"]').first().type('Natalia728');
    cy.get('button[type="submit"]').first().click();

    cy.wait('@login');
    cy.wait('@misPlantas');
    cy.contains('Helecho').should('be.visible');

    cy.get('.btn-monitorear').first().click();
    cy.wait('@monitorear');
    cy.wait('@datos');
    cy.wait('@historial');

    cy.url().should('include', '/monstera?pu=1');
    cy.contains('.monit-sensor-value', 'Temperatura:').should('be.visible');
    cy.contains('button', 'Verificar condiciones').should('be.visible');
  });
});
