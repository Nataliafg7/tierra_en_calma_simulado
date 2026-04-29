import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

let alertMessage = '';

Given('que estoy en la página principal', async ({ page }) => {
  await page.goto('/');
  
  // Configurar el listener para diálogos una sola vez por test
  page.on('dialog', async dialog => {
    alertMessage = dialog.message();
    await dialog.accept();
  });

  // Mockear la API de contacto
  await page.route('**/api/contacto', async route => {
    await route.fulfill({ status: 200, json: { message: 'Mensaje enviado' } });
  });
});

Then('debo ver el formulario de contacto', async ({ page }) => {
  await expect(page.locator('form').first()).toBeVisible();
});

Then('el botón de envío debe estar visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: /enviar mensaje/i }).first()).toBeVisible();
});

Then('el botón de envío debe estar deshabilitado', async ({ page }) => {
  const btnEnviar = page.getByRole('button', { name: /enviar mensaje/i }).first();
  await expect(btnEnviar).toBeDisabled();
});

When('completo el formulario con nombre {string}, correo {string} y mensaje {string}', async ({ page }, nombre: string, correo: string, mensaje: string) => {
  await page.getByLabel(/nombre/i).first().fill(nombre);
  await page.getByLabel(/correo/i).first().fill(correo);
  await page.getByLabel(/mensaje/i).first().fill(mensaje);
});

When('hago clic en el botón de enviar mensaje', async ({ page }) => {
  await page.getByRole('button', { name: /enviar mensaje/i }).first().click();
});

Then('el formulario debe reiniciarse', async ({ page }) => {
  await expect(page.getByLabel(/nombre/i).first()).toHaveValue('');
});

Then('debo ver un mensaje de confirmación {string}', async ({ page }, expectedMessage: string) => {
  expect(alertMessage).toContain(expectedMessage);
});
