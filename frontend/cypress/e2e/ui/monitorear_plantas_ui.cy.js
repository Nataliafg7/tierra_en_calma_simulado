/// <reference types="cypress" />

describe('UI - monitorear plantas', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/mis-plantas', {
      statusCode: 200,
      body: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Planta de Prueba' }]
    }).as('misPlantas');
  });

  it('muestra tarjetas de plantas y acciones visibles', () => {
    cy.visit('http://localhost:4200/mis-plantas', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'usuario',
          JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' })
        );
      }
    });
    cy.wait('@misPlantas');

    cy.contains('.planta-nombre', 'Planta de Prueba').should('be.visible');
    cy.contains('button', 'Monitorear').should('be.visible');
    cy.contains('button', 'Registrar nueva planta').should('be.visible');
  });
});
