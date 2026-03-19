/**
 * HU3 - Inicio de sesión (Backend)
 * Escenario 2 (P2): Login exitoso como usuario normal (Camino C2)
 * Archivo: HU3B_p2.test.js
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
    const app = createApp();
    server = app.listen(0);

    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  test("Escenario 2 (P2) – Login exitoso como usuario normal", async () => {
    const loginPayload = {
      correo_electronico: "juliana@gmail.com",
      contrasena: "juliana",
    };

    const response = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload),
    });

    const data = await response.json();

    // Validación principal
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("message", "Login exitoso");

    // Aquí está la diferencia clave con P1:
    expect(data).toHaveProperty("role", "user");

    // Validación del objeto usuario
    expect(data).toHaveProperty("user");
    expect(data.user).toHaveProperty("ID_USUARIO");
    expect(data.user).toHaveProperty("NOMBRE");
    expect(data.user).toHaveProperty("APELLIDO");
    expect(data.user).toHaveProperty("TELEFONO");
    expect(data.user).toHaveProperty("CORREO_ELECTRONICO");

    // Confirmar que NO es admin
    const correo = String(data.user.CORREO_ELECTRONICO || "").trim().toLowerCase();
    expect(correo).toBe("juliana@gmail.com");
    expect(data.role).not.toBe("admin");
  });
});