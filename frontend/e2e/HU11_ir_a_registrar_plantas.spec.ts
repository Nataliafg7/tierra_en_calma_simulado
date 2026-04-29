import { test, expect } from '@playwright/test';

test('HU11-HU10 - Desde mis plantas navegar a registrar plantas', async ({ page }) => {
  await page.goto('http://localhost:4200/');

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  await page.getByRole('textbox', { name: 'Correo', exact: true }).fill('juliana@gmail.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('juliana');

  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/mis-plantas/);

  await page.getByRole('link', { name: 'Registrar plantas' }).click();

  await expect(page).toHaveURL(/registrar-plantas/);
});