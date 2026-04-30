import { test, expect } from '@playwright/test';

test.describe('Flujo Completo de Telemetría', () => {
  test('SimuladorFlujoCompletoF_P1 - Flujo integral de monitoreo', async ({ page }) => {
    let lastAlertMessage = '';
    page.on('dialog', dialog => {
      lastAlertMessage = dialog.message();
      dialog.accept();
    });

    // Mocking all APIs
    await page.route('**/api/login', route => route.fulfill({ 
      status: 200, 
      json: { user: { ID_USUARIO: 1, NOMBRE: 'Natalia', CORREO_ELECTRONICO: 'test@test.com' } } 
    }));
    await page.route('**/api/mis-plantas', route => route.fulfill({ status: 200, json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Helecho' }] }));
    await page.route('**/api/monitorear', route => route.fulfill({ status: 200, json: { ok: true } }));
    await page.route('**/api/datos', route => route.fulfill({ status: 200, json: { dato: 'T:22.0, H:45.0' } }));
    await page.route('**/api/historial', route => route.fulfill({ status: 200, json: { historial: [] } }));
    await page.route('**/api/verificar-condiciones', route => route.fulfill({ status: 200, json: { ok: true, mensaje: 'Verificación exitosa' } }));

    // 1. Login
    await page.goto('/login');
    const inputCorreo = page.getByPlaceholder('Correo').first();
    if (await inputCorreo.isVisible()) {
      await inputCorreo.fill('1001498893');
      await page.getByPlaceholder('Contraseña').first().fill('Natalia728');
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    }
    await page.waitForTimeout(500);

    // 2. Navigate to Mis Plantas
    await page.goto('/mis-plantas');
    await expect(page.locator('text=Helecho')).toBeVisible();
    
    // 3. Select Plant
    await page.getByRole('button', { name: /monitorear/i }).first().click();
    await page.goto('/monstera?pu=1');

    // 4. Verify Metrics
    await expect(page.locator('text=22.0 °C')).toBeVisible();

    // 5. Verify Conditions
    const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
    await btnVerificar.click();
    
    await page.waitForTimeout(100);
    expect(lastAlertMessage).toContain('Verificación exitosa');
  });
});
