import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  timeout: 30 * 1000,

  expect: {
    timeout: 5000,
  },

  fullyParallel: false,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'on',
    launchOptions: {
      slowMo: 1000,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});