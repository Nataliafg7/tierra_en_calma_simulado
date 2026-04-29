import { test, expect } from '@playwright/test';

test('HU3F_P1 - No debe iniciar sesión con campos vacíos', async ({ page }) => {
  await page.goto('http://localhost:4200/');

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  page.once('dialog', async dialog => {
    expect(dialog.message()).toBe('Ingresa tu correo y contraseña.');
    await dialog.dismiss();
  });

  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/localhost:4200/);
});