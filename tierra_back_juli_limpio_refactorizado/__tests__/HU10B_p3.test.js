/**
 * HU10 (Backend) - Asociación de planta
 * Escenario 3 (P3): Error durante el INSERT (execute falla)
 * Archivo: HU10B_p3.test.js
 *
 */

const { createApp } = require("../app");

describe("Pruebas Unitarias Backend – HU10 Asociación de planta", () => {
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

  test("Escenario 3 (P3) – Debe retornar 500 cuando falla el INSERT (integridad)", async () => {
    //  Usamos un id_usuario casi seguro inexistente
    // La idea es que NO exista en TIERRA_EN_CALMA.USUARIOS
    const payload = {
      id_usuario: 999999,
      id_planta: 25, // debe existir en BANCO_PLANTAS para que el fallo sea por el usuario
    };

    const resp = await fetch(`${baseUrl}/api/registrar-planta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 1) Assertion del status
    expect(resp.status).toBe(500);

    // 2) Assertion del body
    const data = await resp.json();
    expect(data).toEqual({ error: "Error al registrar planta" });
  });
});