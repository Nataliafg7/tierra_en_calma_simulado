import { test, expect } from '@playwright/test';

test('HU1 - Registro exitoso de usuario', async ({ page }) => {
  const numero = Date.now();
  const correo = `prueba${numero}@gmail.com`;

  await page.route('**/api/register', async route => {
    await route.fulfill({ status: 200, json: { message: 'Usuario registrado con éxito.' } });
  });

  await page.goto('http://localhost:4200/');

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();
  await page.getByRole('button', { name: 'Regístrate' }).click();

  await page.getByRole('textbox', { name: 'Identificación' }).fill(String(numero).slice(-10));
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Prueba');
  await page.getByRole('textbox', { name: 'Apellido' }).fill('Playwright');
  await page.getByRole('textbox', { name: 'Teléfono' }).fill('3127765569');
  await page.getByRole('textbox', { name: 'Correo', exact: true }).fill(correo);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('Pruebapruebita');

  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Usuario registrado');
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'Registrar' }).click();
});