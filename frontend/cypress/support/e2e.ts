// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Comandos personalizados del proyecto.
import './commands';

// Soporte para pruebas automatizadas de accesibilidad.
import 'cypress-axe';

// Soporte para pruebas visuales con Applitools Eyes.
import '@applitools/eyes-cypress/commands';