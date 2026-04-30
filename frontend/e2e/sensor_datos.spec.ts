import { test, expect } from '@playwright/test';

test.describe('Visualización de Sensor y Datos', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    await page.route('**/api/login', route => route.fulfill({ 
      status: 200, 
      json: { user: { NOMBRE: 'Natalia', CORREO_ELECTRONICO: 'test@test.com' } } 
    }));
    
    await page.route('**/api/datos', route => route.fulfill({ 
      status: 200, 
      json: { dato: 'T:25.0, H:60.0' } 
    }));

    await page.route('**/api/historial', route => route.fulfill({ 
      status: 200, 
      json: { historial: [{ TEMPERATURA: 25, HUMEDAD: 60, FECHA_HORA: new Date().toISOString() }] } 
    }));

    await page.goto('/login');
    
    const inputCorreo = page.getByPlaceholder('Correo').first();
    if (await inputCorreo.isVisible()) {
      await inputCorreo.fill('1001498893');
      await page.getByPlaceholder('Contraseña').first().fill('Natalia728');
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    }
    
    await page.waitForTimeout(500);
  });

  test('SensorDatosF_P1 - Visualización de lecturas actuales', async ({ page }) => {
    await page.goto('/monstera?pu=1');
    await expect(page.locator('text=25.0 °C')).toBeVisible();
    await expect(page.locator('text=60.0%')).toBeVisible();
  });

  test('SensorDatosF_P2 - Visualización del historial', async ({ page }) => {
    await page.goto('/monstera?pu=1');
    await expect(page.locator('canvas')).toBeVisible();
  });
});
