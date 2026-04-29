import { test, expect } from '@playwright/test';

test('HU3-HU11 - Login correcto y visualización de mis plantas', async ({ page }) => {
  await page.goto('http://localhost:4200/');

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  await page.getByRole('textbox', { name: 'Correo', exact: true }).fill('juliana@gmail.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('juliana');

  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Bienvenid@');
    await dialog.dismiss();
  });

  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/mis-plantas/);
  await expect(page.getByRole('link', { name: 'Mis plantas' })).toBeVisible();
});