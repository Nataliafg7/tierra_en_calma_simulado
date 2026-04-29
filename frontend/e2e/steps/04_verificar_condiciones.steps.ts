import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

let dialogPromise: Promise<any>;

Given('que tengo una sesión activa', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));
  });
});

Given('me encuentro en la vista de la planta con ID {string}', async ({ page }, id: string) => {
  await page.goto(`/monstera?pu=${id}`);
});

Given('que el servidor reporta condiciones óptimas', async ({ page }) => {
  await page.route('**/api/verificar-condiciones', route => route.fulfill({ 
    status: 200, 
    json: { ok: true, mensaje: 'Condiciones óptimas. No se requiere riego.' } 
  }));
});

Given('que el servidor reporta que se requiere riego', async ({ page }) => {
  await page.route('**/api/verificar-condiciones', route => route.fulfill({ 
    status: 200, 
    json: { ok: true, mensaje: 'Riego automático activado por baja humedad.' } 
  }));
});

When('hago clic en el botón de verificar condiciones', async ({ page }) => {
  dialogPromise = page.waitForEvent('dialog');
  const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
  await btnVerificar.click();
});

Then('debo ver una alerta con el mensaje {string}', async ({ page }, expectedMessage: string) => {
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain(expectedMessage);
  await dialog.accept();
});
