import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('que tengo una sesión activa y plantas registradas', async ({ page }) => {
  await page.route('**/api/mis-plantas', route => route.fulfill({ 
    status: 200, 
    json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Planta de Prueba' }] 
  }));

  await page.route('**/api/monitorear', async route => {
    await route.fulfill({ status: 200, json: { ok: true, id_sensor: 'TEST-SENSOR-123' } });
  });

  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));
  });
});

Given('me encuentro en la sección {string}', async ({ page }, seccion: string) => {
  // Mapear nombre de sección a URL si es necesario
  await page.goto('/mis-plantas');
});

Then('debo ver mi planta {string} en la lista', async ({ page }, planta: string) => {
  await expect(page.locator(`text=${planta}`)).toBeVisible();
});

When('hago clic en el botón de monitorear de la planta', async ({ page }) => {
  const btnMonitorear = page.getByRole('button', { name: /monitorear/i }).first();
  await btnMonitorear.click();
});

Then('debo ser redirigido a la vista de monitoreo con ID de planta {string}', async ({ page }, id: string) => {
  await expect(page).toHaveURL(new RegExp(`.*monstera\\?pu=${id}`));
});
