/**
 * HU3 - Inicio de sesión (Backend)
 * Escenario 6 (P6): Error durante connection.close() (Camino C6)
 * Archivo: HU3B_p6.test.js
 *
 * IMPORTANTE (decisión técnica):
 * - Sin mocks y sin modificar el backend, no es posible forzar de forma determinística
 *   un fallo en connection.close() desde una petición HTTP normal.
 * - El método close() depende del estado interno del driver y de la sesión Oracle.
 * - Para reproducirlo de forma controlada se requeriría:
 *   a) mocks/spy sobre connection.close(), o
 *   b) intervención externa sobre la sesión (KILL SESSION, caída controlada del servicio),
 *      lo cual corresponde a pruebas de integración/ambiente, no unitarias puras.
 *
 * Por lo anterior, este caso se documenta como camino del CFG, pero se marca como no ejecutable
 * en pruebas unitarias "sin mocks".
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

  test.skip("Escenario 6 (P6) – Debe retornar 500 cuando falla close() (no reproducible sin mocks)", async () => {
    // Este test queda como evidencia de que el escenario fue identificado,
    // pero no se ejecuta por la limitación técnica descrita arriba.

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

    // Si close() fallara y entrara al catch, el endpoint retornaría:
    // status 500 y { error: "Error al iniciar sesión" }
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Error al iniciar sesión" });
  });
});