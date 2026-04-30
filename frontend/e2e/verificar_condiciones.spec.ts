import { test, expect } from '@playwright/test';

test.describe('Verificar Condiciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));
    });
  });

  test('VerificarCondicionesF_P1 - Condiciones óptimas', async ({ page }) => {
    await page.route('**/api/verificar-condiciones', route => route.fulfill({ 
      status: 200, 
      json: { ok: true, mensaje: 'Condiciones óptimas. No se requiere riego.' } 
    }));

    await page.goto('/monstera?pu=1');

    const dialogPromise = page.waitForEvent('dialog');
    const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
    await btnVerificar.click();
    
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Condiciones óptimas');
    await dialog.accept();
  });

  test('VerificarCondicionesF_P2 - Activación de riego automático', async ({ page }) => {
    await page.route('**/api/verificar-condiciones', route => route.fulfill({ 
      status: 200, 
      json: { ok: true, mensaje: 'Riego automático activado por baja humedad.' } 
    }));

    await page.goto('/monstera?pu=1');

    const dialogPromise = page.waitForEvent('dialog');
    const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
    await btnVerificar.click();
    
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Riego automático activado');
    await dialog.accept();
  });
});
