import { test, expect } from '@playwright/test';

test('HU11-HU10 - Desde mis plantas navegar a registrar plantas', async ({ page }) => {
  await page.route('**/api/login', route => route.fulfill({ 
    status: 200, 
    json: { user: { ID_USUARIO: 1, NOMBRE: 'Juliana', CORREO_ELECTRONICO: 'juliana@gmail.com' } } 
  }));

  await page.route('**/api/mis-plantas', route => route.fulfill({ 
    status: 200, 
    json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Planta de Prueba' }] 
  }));

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