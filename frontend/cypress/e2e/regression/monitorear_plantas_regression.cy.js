/// <reference types="cypress" />

describe('Regresion - monitorear plantas', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/mis-plantas', (req) => {
      expect(req.headers['x-user-id']).to.eq('1');
      req.reply({
        statusCode: 200,
        body: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Planta de Prueba' }]
      });
    }).as('misPlantas');

    cy.intercept('POST', '**/api/monitorear', {
      statusCode: 200,
      body: { ok: true, id_sensor: 'TEST-SENSOR-123' }
    }).as('monitorear');
  });

  it('mantiene la navegacion a la vista de monitoreo', () => {
    cy.visit('http://localhost:4200/mis-plantas', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'usuario',
          JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' })
        );
      }
    });
    cy.wait('@misPlantas');

    cy.contains('Planta de Prueba').should('be.visible');
    cy.get('.btn-monitorear').first().click();

    cy.wait('@monitorear');
    cy.url().should('include', '/monstera?pu=1');
  });
});
