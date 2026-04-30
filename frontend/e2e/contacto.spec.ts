import { test, expect } from '@playwright/test';

test.describe('Formulario de Contacto', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mockear la API de contacto
    await page.route('**/api/contacto', async route => {
      await route.fulfill({ status: 200, json: { message: 'Mensaje enviado' } });
    });
  });

  test('ContactoF_P1 - Visualización del formulario', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar mensaje/i }).first()).toBeVisible();
  });

  test('ContactoF_P2 - Validación de campos vacíos', async ({ page }) => {
    const btnEnviar = page.getByRole('button', { name: /enviar mensaje/i }).first();
    await expect(btnEnviar).toBeDisabled();
  });

  test('ContactoF_P3 - Envío exitoso del formulario', async ({ page }) => {
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByLabel(/nombre/i).first().fill('Test User');
    await page.getByLabel(/correo/i).first().fill('test@example.com');
    await page.getByLabel(/mensaje/i).first().fill('Prueba E2E');
    
    await page.getByRole('button', { name: /enviar mensaje/i }).first().click();

    await expect(page.getByLabel(/nombre/i).first()).toHaveValue('');
    expect(alertMessage).toContain('fue enviado correctamente');
  });
});
