import { defineConfig } from 'cypress';
import eyesPlugin from '@applitools/eyes-cypress';
export default eyesPlugin(defineConfig({
  projectId: 'uaxddz',
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.ts',

    setupNodeEvents(on, config) {
      return config;
    },
  },
}));