import { test, expect } from '@playwright/test';

test.describe('F5 - Verificar Condiciones', () => {
  test.beforeEach(async ({ page }) => {
    // Inyectar usuario en localStorage para evitar redirección a /login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));
    });

    // Ir directamente a la vista de la planta con su ID
    await page.goto('/monstera?pu=1');
  });

  test('debe notificar que las condiciones son óptimas', async ({ page }) => {
    await page.route('**/api/verificar-condiciones', route => route.fulfill({ 
      status: 200, 
      json: { ok: true, mensaje: 'Condiciones óptimas. No se requiere riego.' } 
    }));

    // Preparar la escucha del evento de diálogo ANTES de hacer clic
    const dialogPromise = page.waitForEvent('dialog');

    // Clicar en botón de verificar
    const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
    await btnVerificar.click();

    // Esperar a que el alert aparezca, capturarlo y validarlo
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Condiciones óptimas');
    await dialog.accept();
  });

  test('debe notificar que se activó el riego automático', async ({ page }) => {
    await page.route('**/api/verificar-condiciones', route => route.fulfill({ 
      status: 200, 
      json: { ok: true, mensaje: 'Riego automático activado por baja humedad.' } 
    }));

    const dialogPromise = page.waitForEvent('dialog');

    const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
    await btnVerificar.click();

    // Esperar a que el alert aparezca, capturarlo y validarlo
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Riego automático activado');
    await dialog.accept();
  });
});
