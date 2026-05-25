import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'uaxddz',
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.js',
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });
    supportFile: 'cypress/support/e2e.ts',

    setupNodeEvents(on, config) {
      return config;
    },
  },
});