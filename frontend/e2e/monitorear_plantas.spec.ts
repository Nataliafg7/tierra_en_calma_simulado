import { test, expect } from '@playwright/test';

test.describe('Monitorear Planta', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/mis-plantas', route => route.fulfill({ 
      status: 200, 
      json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Planta de Prueba' }] 
    }));

    await page.route('**/api/monitorear', async route => {
      await route.fulfill({ status: 200, json: { ok: true, id_sensor: 'TEST-SENSOR-123' } });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));
    });
  });

  test('MonitorearPlantasF_P1 - Activación de monitoreo exitosa', async ({ page }) => {
    await page.goto('/mis-plantas');
    await expect(page.locator('text=Planta de Prueba')).toBeVisible();
    
    const btnMonitorear = page.getByRole('button', { name: /monitorear/i }).first();
    await btnMonitorear.click();
    
    await expect(page).toHaveURL(/.*monstera\?pu=1/);
  });
});
