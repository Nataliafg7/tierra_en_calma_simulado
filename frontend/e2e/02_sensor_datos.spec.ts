import { test, expect } from '@playwright/test';

test.describe('F2 y F4 - Visualización de Sensor y Datos', () => {
  // Login previo asumiendo que es una vista protegida
  test.beforeEach(async ({ page }) => {
    // Aceptar automáticamente los alerts (como el "Bienvenid@" del login)
    page.on('dialog', dialog => dialog.accept());

    // Interceptar login con el formato EXACTO que espera tu componente (res.user.NOMBRE)
    await page.route('**/api/login', route => route.fulfill({ 
      status: 200, 
      json: { user: { NOMBRE: 'Natalia', CORREO_ELECTRONICO: 'test@test.com' } } 
    }));
    
    // Mockear la respuesta de datos e historial para tener resultados predecibles
    // El componente usa una expresión regular (/T[:=]/ y /H[:=]/) para extraer los números
    await page.route('**/api/datos', route => route.fulfill({ 
      status: 200, 
      json: { dato: 'T:25.0, H:60.0' } 
    }));
    await page.route('**/api/historial', route => route.fulfill({ 
      status: 200, 
      json: { historial: [{ TEMPERATURA: 25, HUMEDAD: 60, FECHA_HORA: new Date().toISOString() }] } 
    }));

    await page.goto('/login');
    
    // El input de correo en el login usa placeholder="Correo" (y type="text")
    const inputCorreo = page.getByPlaceholder('Correo').first();
    
    if (await inputCorreo.isVisible()) {
      await inputCorreo.fill('1001498893');
      await page.getByPlaceholder('Contraseña').first().fill('Natalia728');
      await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    }
    
    // Esperamos a que la petición de login se intercepte y complete
    await page.waitForTimeout(500);
    
    // Forzar la ida a la ruta de los datos. 
    // CRÍTICO: MonsteraComponent requiere el parámetro ?pu=1 (ID de Planta)
    // Si no se envía, aborta el fetch de datos y muestra '---'.
    await page.goto('/monstera?pu=1');
  });

  test('debe mostrar la última lectura de temperatura y humedad', async ({ page }) => {
    // Validar que el componente de texto que muestra el último dato parseado se renderice
    await expect(page.locator('text=25.0 °C')).toBeVisible();
    await expect(page.locator('text=60.0%')).toBeVisible();
  });

  test('debe renderizar el gráfico del historial', async ({ page }) => {
    // Validar que el elemento canvas (Chart.js) existe en el DOM
    await expect(page.locator('canvas')).toBeVisible();
  });
});
