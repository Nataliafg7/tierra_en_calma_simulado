/**
 * HU3 - Inicio de sesión (Backend)
 * Escenario 5 (P5): Error durante la ejecución del SELECT (Camino C5)
 * Archivo: HU3B_p5.test.js
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

  test("Escenario 5 (P5) – Debe retornar 500 cuando falla el SELECT y entra al catch", async () => {
    // Forzamos error real en execute enviando valores inválidos
    const loginPayload = {
      correo_electronico: null,
      contrasena: null,
    };

    const response = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload),
    });

    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Error al iniciar sesión" });
  });
});