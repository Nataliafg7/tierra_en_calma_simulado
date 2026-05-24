import { defineConfig } from "cypress";

export default defineConfig({
  projectId: 'uaxddz',
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
