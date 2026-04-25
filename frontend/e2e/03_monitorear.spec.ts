import { test, expect } from '@playwright/test';

test.describe('F3 - Monitorear Planta', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar llamadas para simular base de datos
    await page.route('**/api/mis-plantas', route => route.fulfill({ 
      status: 200, 
      json: [{ ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Planta de Prueba' }] 
    }));

    await page.route('**/api/monitorear', async route => {
      // Retornar éxito en la activación del sensor
      await route.fulfill({ status: 200, json: { ok: true, id_sensor: 'TEST-SENSOR-123' } });
    });

    // Inyectar un usuario falso en localStorage para que Angular no nos patee al login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));
    });

    // Ahora sí podemos ir a la vista protegida
    await page.goto('/mis-plantas');
  });

  test('debe permitir activar el monitoreo para una planta', async ({ page }) => {
    // Validar que la planta simulada aparece
    await expect(page.locator('text=Planta de Prueba')).toBeVisible();
    
    // Buscar botón de monitorear
    const btnMonitorear = page.getByRole('button', { name: /monitorear/i }).first();
    await btnMonitorear.click();

    // Validar que se redirigió exitosamente a la vista de la planta (monstera) con el parámetro pu=1
    await expect(page).toHaveURL(/.*monstera\?pu=1/);
  });
});
