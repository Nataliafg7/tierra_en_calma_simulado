import { test, expect } from '@playwright/test';

test.describe('F1 - Formulario de Contacto', () => {
  test.beforeEach(async ({ page }) => {
    // El formulario de contacto está en el footer (disponible en la ruta raíz)
    await page.goto('/');
  });

  test('debe mostrar el formulario de contacto correctamente', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar mensaje/i }).first()).toBeVisible();
  });

  test('debe mantener el botón de envío deshabilitado si el formulario está vacío', async ({ page }) => {
    const btnEnviar = page.getByRole('button', { name: /enviar mensaje/i }).first();
    await expect(btnEnviar).toBeDisabled();
  });

  test('debe enviar el formulario con datos válidos', async ({ page }) => {
    let alertMessage = '';
    
    // Configurar Playwright para que acepte automáticamente cualquier alert nativo
    // y guarde el mensaje para validarlo después. Esto evita bloqueos o redirecciones raras.
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Interceptar la petición de red para no enviar correos reales
    await page.route('**/api/contacto', async route => {
      await route.fulfill({ status: 200, json: { message: 'Mensaje enviado' } });
    });

    await page.getByLabel(/nombre/i).first().fill('Test User');
    await page.getByLabel(/correo/i).first().fill('test@example.com');
    await page.getByLabel(/mensaje/i).first().fill('Prueba E2E');
    
    await page.getByRole('button', { name: /enviar mensaje/i }).first().click();

    // Validar que el formulario se reseteó automáticamente (comportamiento de Angular)
    await expect(page.getByLabel(/nombre/i).first()).toHaveValue('');
    
    // Validar que se capturó el alert con el texto correcto
    expect(alertMessage).toContain('fue enviado correctamente');
  });
});
