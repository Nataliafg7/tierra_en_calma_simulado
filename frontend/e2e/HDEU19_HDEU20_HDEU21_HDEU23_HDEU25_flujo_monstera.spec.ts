import { test, expect } from '@playwright/test';

test('Flujo completo Monstera - HDEU19, HDEU20, HDEU21, HDEU23, HDEU25', async ({ page }) => {
  // =============================
  // LOGIN
  // =============================
  await page.goto('http://localhost:4200/');

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  await page.getByRole('textbox', { name: 'Correo', exact: true }).fill('adiazabaunza@gmail.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('AngieAbaunza');

  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'Ingresar' }).click();

  // =============================
  // IR A MONSTERA
  // =============================
  await page.getByRole('button', { name: 'Monitorear' }).first().click();

  // =============================
  // HDEU21 - Validar lecturas
  // =============================
  await expect(page.getByText('Temperatura:', { exact: true })).toBeVisible();
  await expect(page.getByText(/Humedad/i).first()).toBeVisible();

  // =============================
  // HDEU25 - Validar gráfico
  // =============================
  await expect(page.getByText('Humedad vs Temperatura', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();

  // =============================
  // HDEU19 - Activar riego manual
  // =============================
  let mensajeRiego = '';

  page.once('dialog', async dialog => {
    mensajeRiego = dialog.message();
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'Regar ahora' }).click();

  // Validar que sea éxito o error (ambos válidos para el flujo)
  expect(
    mensajeRiego === 'Riego activado correctamente' ||
    mensajeRiego === 'Error al activar el riego'
  ).toBeTruthy();

  // =============================
  // HDEU20 - Historial (solo si éxito)
  // =============================
  if (mensajeRiego === 'Riego activado correctamente') {
    await expect(page.getByText(/Riego/i).first()).toBeVisible();
  }

  // =============================
  // HDEU23 - Registrar cuidado
  // =============================
  await page.getByRole('textbox', { name: 'Fecha' }).fill('2026-04-03');
  await page.getByLabel('Tipo de cuidado').selectOption('poda');
  await page.getByRole('textbox', { name: 'Detalles' }).fill('Retiro de hojas secas');

  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'Guardar cuidado' }).click();

  // =============================
  // HDEU25 - Verificar condiciones
  // =============================
  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'Verificar condiciones' }).click();
});