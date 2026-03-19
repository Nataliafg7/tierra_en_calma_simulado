/**
 * HU3 - Inicio de sesión (Backend)
 * Escenario 1 (P1): Login exitoso como administrador (Camino C1)
 * Archivo: HU3B_p1.test.js
 *
 * Reglas:
 * - Sin mocks
 * - Sin Supertest
 * - Con Jest
 * - Petición HTTP real con fetch
 * - Servidor temporal levantado con createApp()
 */

const { createApp } = require("../app");

describe("Pruebas Unitarias – HU3 Inicio de sesión (Backend)", () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    // 1) Creamos la app (no usamos el servidor principal; solo construimos rutas)
    const app = createApp();

    // 2) Levantamos un servidor temporal en un puerto libre (0 = puerto automático)
    server = app.listen(0);

    // 3) Guardamos la URL base para llamar el endpoint
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    // 4) Cerramos el servidor temporal al final (para que Jest termine limpio)
    server.close();
  });

  test("Escenario 1 (P1) – Login exitoso como administrador", async () => {
    const loginPayload = {
      correo_electronico: "admin@tierraencalma.com",
      contrasena: "admin123",
    };

    const response = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload),
    });

    const data = await response.json();

    // Validación principal del camino feliz (C1)
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("message", "Login exitoso");
    expect(data).toHaveProperty("role", "admin");

    // Validación de estructura del usuario retornado por el SELECT
    expect(data).toHaveProperty("user");
    expect(data.user).toHaveProperty("ID_USUARIO");
    expect(data.user).toHaveProperty("NOMBRE");
    expect(data.user).toHaveProperty("APELLIDO");
    expect(data.user).toHaveProperty("TELEFONO");
    expect(data.user).toHaveProperty("CORREO_ELECTRONICO");

    // Confirmar que el correo corresponde al admin (normalizado)
    const correo = String(data.user.CORREO_ELECTRONICO || "").trim().toLowerCase();
    expect(correo).toBe("admin@tierraencalma.com");
  });
});