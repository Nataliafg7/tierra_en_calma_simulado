/**
 * HU10 (Backend) - Asociación de una planta del banco a la cuenta del usuario
 * Escenario 1 (P1): Asociación exitosa
 * Archivo: HU10B_p1.test.js
 *
 */

const { createApp } = require("../app");

describe("Pruebas Unitarias Backend – HU10 Asociación de planta", () => {
  let server;
  let baseUrl;

  const ID_USUARIO = 1000410154;
  const ID_PLANTA = 25;

  beforeAll(() => {
    const app = createApp();
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  test("Escenario 1 (P1) – Asociación exitosa", async () => {
    const payload = {
      id_usuario: ID_USUARIO,
      id_planta: ID_PLANTA,
    };

    const resp = await fetch(`${baseUrl}/api/registrar-planta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 1) Assertion del código HTTP
    expect(resp.status).toBe(200);

    // 2) Assertion del body
    const data = await resp.json();
    expect(data).toEqual({
      message: "Planta registrada con éxito en tu jardín",
    });
  });
});