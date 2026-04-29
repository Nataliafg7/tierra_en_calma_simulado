import { test, expect } from '@playwright/test';

test('HU8-HU10-HU11 - Registrar planta y visualizarla en mis plantas', async ({ page }) => {
  await page.goto('http://localhost:4200/');

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  await page.getByRole('textbox', { name: 'Correo', exact: true }).fill('juliana@gmail.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('juliana');

  page.once('dialog', async dialog => {
    await dialog.dismiss();
  });

  await page.getByRole('button', { name: 'Ingresar' }).click();

  await page.getByRole('link', { name: 'Registrar plantas' }).click();

  await expect(page).toHaveURL(/registrar-plantas/);

  page.once('dialog', async dialog => {
    await dialog.dismiss();
  });

  await page
    .locator('section')
    .filter({ hasText: 'Hoja de Violín' })
    .getByRole('button')
    .click();

  await page.getByRole('link', { name: 'Mis plantas' }).click();

  await expect(page).toHaveURL(/mis-plantas/);
  await expect(page.getByText(/Hoja de Violín|Ficus lyrata/i)).toBeVisible();
});