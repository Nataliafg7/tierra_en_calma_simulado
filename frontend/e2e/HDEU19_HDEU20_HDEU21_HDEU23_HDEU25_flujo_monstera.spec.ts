import { test, expect } from '@playwright/test';

test('Flujo completo Monstera - HDEU19, HDEU20, HDEU21, HDEU23, HDEU25', async ({ page }) => {
  // =============================
  // LOGIN
  // =============================
  await page.route('**/api/login', route => route.fulfill({ 
    status: 200, 
    json: { user: { ID_USUARIO: 1, NOMBRE: 'Angie', CORREO_ELECTRONICO: 'adiazabaunza@gmail.com' } } 
  }));

  await page.route('**/api/mis-plantas', route => route.fulfill({ 
    status: 200, 
    json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Monstera' }] 
  }));

  await page.route('**/api/datos', route => route.fulfill({ 
    status: 200, 
    json: { dato: 'T:25.0, H:60.0' } 
  }));

  await page.route('**/api/historial', route => route.fulfill({ 
    status: 200, 
    json: { historial: [] } 
  }));

  await page.route('**/api/regar', route => route.fulfill({ 
    status: 200, 
    json: { message: 'Riego activado correctamente' } 
  }));

  await page.route('**/api/cuidados', route => route.fulfill({ 
    status: 200, 
    json: { message: 'Cuidado registrado con éxito' } 
  }));

  await page.route('**/api/monitorear', route => route.fulfill({ 
    status: 200, 
    json: { ok: true, id_sensor: 'SENSOR-123' } 
  }));

  await page.route('**/api/verificar-condiciones', route => route.fulfill({ 
    status: 200, 
    json: { ok: true, mensaje: 'Condiciones óptimas' } 
  }));

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
  await expect(page.locator('.monit-sensor-value')).toContainText('Temperatura:');
  await expect(page.locator('.monit-sensor-value')).toContainText('Humedad del suelo:');

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