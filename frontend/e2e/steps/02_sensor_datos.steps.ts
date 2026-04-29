import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, Then } = createBdd();

Given('que he iniciado sesión exitosamente', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());

  await page.route('**/api/login', route => route.fulfill({ 
    status: 200, 
    json: { user: { NOMBRE: 'Natalia', CORREO_ELECTRONICO: 'test@test.com' } } 
  }));
  
  await page.route('**/api/datos', route => route.fulfill({ 
    status: 200, 
    json: { dato: 'T:25.0, H:60.0' } 
  }));

  await page.route('**/api/historial', route => route.fulfill({ 
    status: 200, 
    json: { historial: [{ TEMPERATURA: 25, HUMEDAD: 60, FECHA_HORA: new Date().toISOString() }] } 
  }));

  await page.goto('/login');
  
  const inputCorreo = page.getByPlaceholder('Correo').first();
  if (await inputCorreo.isVisible()) {
    await inputCorreo.fill('1001498893');
    await page.getByPlaceholder('Contraseña').first().fill('Natalia728');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  }
  
  await page.waitForTimeout(500);
});

Given('accedo a la vista de monitoreo de mi planta con ID {string}', async ({ page }, id: string) => {
  await page.goto(`/monstera?pu=${id}`);
});

Then('debo ver la lectura de temperatura {string}', async ({ page }, temp: string) => {
  await expect(page.locator(`text=${temp}`)).toBeVisible();
});

Then('debo ver la lectura de humedad {string}', async ({ page }, hum: string) => {
  await expect(page.locator(`text=${hum}`)).toBeVisible();
});

Then('debo ver el gráfico del historial de lecturas', async ({ page }) => {
  await expect(page.locator('canvas')).toBeVisible();
});
