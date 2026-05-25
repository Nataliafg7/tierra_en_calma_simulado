/// <reference types="cypress" />
/// <reference types="@applitools/eyes-cypress" />

describe('IA Visual - Registrar plantas con Applitools Eyes', () => {
  beforeEach(() => {
    cy.eyesOpen({
      appName: 'Tierra en Calma',
      testName: 'Validación visual IA - Catálogo de registrar plantas',
      batchName: 'Pruebas IA Juliana - Applitools Eyes',
      browser: [
        { width: 1000, height: 660, name: 'chrome' }
      ]
    });
  });

  afterEach(() => {
    cy.eyesClose();
  });

  it('AI-AP-01: valida visualmente el catálogo de plantas disponibles', () => {
    cy.visit('/login');

    // Abrir directamente la sección pública de registrar plantas
    cy.visit('/registrar-plantas');

    // Verificar que la pantalla cargó correctamente
    cy.contains('Registrar', { timeout: 10000 }).should('be.visible');
    cy.contains('Potus').should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible');

    // Validación visual inteligente de toda la pantalla
    cy.eyesCheckWindow({
      tag: 'Catálogo de plantas disponibles',
      target: 'window',
      fully: true
    });
  });
});