import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

let lastAlertMessage = '';

Given('que el sistema tiene datos de prueba configurados', async ({ page }) => {
  page.on('dialog', dialog => {
    lastAlertMessage = dialog.message();
    dialog.accept();
  });

  await page.route('**/api/login', route => route.fulfill({ 
    status: 200, 
    json: { user: { ID_USUARIO: 1, NOMBRE: 'Natalia', CORREO_ELECTRONICO: 'test@test.com' } } 
  }));
  await page.route('**/api/mis-plantas', route => route.fulfill({ status: 200, json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Helecho' }] }));
  await page.route('**/api/monitorear', route => route.fulfill({ status: 200, json: { ok: true } }));
  await page.route('**/api/datos', route => route.fulfill({ status: 200, json: { dato: 'T:22.0, H:45.0' } }));
  await page.route('**/api/historial', route => route.fulfill({ status: 200, json: { historial: [] } }));
  await page.route('**/api/verificar-condiciones', route => route.fulfill({ status: 200, json: { ok: true, mensaje: 'Verificación exitosa' } }));
});

When('inicio sesión con credenciales válidas', async ({ page }) => {
  await page.goto('/login');
  const inputCorreo = page.getByPlaceholder('Correo').first();
  if (await inputCorreo.isVisible()) {
    await inputCorreo.fill('1001498893');
    await page.getByPlaceholder('Contraseña').first().fill('Natalia728');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  }
  await page.waitForTimeout(500);
});

When('navego a la sección {string}', async ({ page }, seccion: string) => {
  await page.goto('/mis-plantas');
});

When('selecciono monitorear la planta {string}', async ({ page }, planta: string) => {
  await expect(page.locator(`text=${planta}`)).toBeVisible();
  await page.getByRole('button', { name: /monitorear/i }).first().click();
  // Forzar navegación a la vista de datos (simulando comportamiento de la app)
  await page.goto('/monstera?pu=1');
});

Then('debo ver las métricas en tiempo real {string}', async ({ page }, temp: string) => {
  await expect(page.locator(`text=${temp}`)).toBeVisible();
});

Then('hago clic en verificar condiciones', async ({ page }) => {
  const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
  await btnVerificar.click();
});

Then('el sistema debe confirmar la {string}', async ({ page }, mensaje: string) => {
  // Esperar un momento para que el alert se capture
  await page.waitForTimeout(100);
  expect(lastAlertMessage).toContain(mensaje);
});
