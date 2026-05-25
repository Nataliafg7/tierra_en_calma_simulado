/// <reference types="cypress" />
import { logA11yViolations } from '../../support/a11y-log';

describe('Accesibilidad - monitorear plantas', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/mis-plantas', {
      statusCode: 200,
      body: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Planta de Prueba' }]
    }).as('misPlantas');

    cy.visit('http://localhost:4200/mis-plantas', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'usuario',
          JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' })
        );
      }
    });

    cy.wait('@misPlantas');
  });

  it('expone tarjetas y boton de monitoreo con nombres claros', () => {
    cy.injectAxe();

    cy.contains('.planta-nombre', 'Planta de Prueba').should('be.visible');
    cy.contains('button', 'Monitorear').should('be.visible');
    cy.contains('button', 'Registrar nueva planta').should('be.visible');

    cy.checkA11y('.plantas-grid, .nuevas-plantas-section', null, logA11yViolations);
  });
});
