import { test, expect } from '@playwright/test';

test.describe('E2E - Flujo Completo de Telemetría', () => {
  test('flujo desde activación hasta verificación', async ({ page }) => {
    // Aceptar alertas nativas para no bloquear la prueba
    page.on('dialog', dialog => dialog.accept());

    // 1. Setup inicial de rutas interceptadas
    await page.route('**/api/login', route => route.fulfill({ 
      status: 200, 
      json: { user: { ID_USUARIO: 1, NOMBRE: 'Natalia', CORREO_ELECTRONICO: 'test@test.com' } } 
    }));
    await page.route('**/api/mis-plantas', route => route.fulfill({ status: 200, json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Helecho' }] }));
    await page.route('**/api/monitorear', route => route.fulfill({ status: 200, json: { ok: true } }));
    await page.route('**/api/datos', route => route.fulfill({ status: 200, json: { dato: 'T:22.0, H:45.0' } }));
    await page.route('**/api/historial', route => route.fulfill({ status: 200, json: { historial: [] } }));
    await page.route('**/api/verificar-condiciones', route => route.fulfill({ status: 200, json: { ok: true, mensaje: 'Verificación exitosa' } }));

    // 2. Login simulado
    await page.goto('/login');
    const inputCorreo = page.getByPlaceholder('Correo').first();
    if (await inputCorreo.isVisible()) {
      await inputCorreo.fill('1001498893');
      await page.getByPlaceholder('Contraseña').first().fill('Natalia728');
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    }

    // Esperar a que el login procese
    await page.waitForTimeout(500);

    // 3. Etapa 1: Ir a mis-plantas
    await page.goto('/mis-plantas');
    await expect(page.locator('text=Helecho')).toBeVisible();
    await page.getByRole('button', { name: /monitorear/i }).first().click();
    
    // 4. Etapa 2 y 3: Ir a la vista de datos de la planta con el ID de la planta (?pu=1)
    await page.goto('/monstera?pu=1');
    await expect(page.locator('text=22.0 °C')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();

    // 5. Etapa 4: Verificar condiciones
    const dialogPromise = page.waitForEvent('dialog');
    const btnVerificar = page.getByRole('button', { name: /verificar condiciones/i }).first();
    await btnVerificar.click();
    
    // Validar mensaje capturado del alert nativo
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Verificación exitosa');
    // NO llamamos a dialog.accept() aquí porque el page.on('dialog') global de la línea 6 ya lo aceptó automáticamente
  });
});
