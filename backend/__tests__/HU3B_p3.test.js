/**
 * HU3 - Inicio de sesión (Backend)
 * Escenario 3 (P3): Credenciales inválidas (Camino C3)
 * Archivo: HU3B_p3.test.js

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

  test("Escenario 3 (P3) – Debe retornar 401 cuando las credenciales son inválidas", async () => {
    // Usamos datos válidos en formato, pero incorrectos para forzar rows.length === 0
    const loginPayload = {
      correo_electronico: "juliana@gmail.com",
      contrasena: "contrasena_incorrect_123",
    };

    const response = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload),
    });

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ message: "Credenciales inválidas" });
  });
});