/**
 * HU3 - Inicio de sesión (Backend)
 * Escenario 4 (P4): Error en Oracle / conexión (Camino C4 - catch)
 * Archivo: HU3B_p4.test.js

- se configuran variables ORACLE inválidas
 *   antes de crear la app. Luego se restauran al finalizar.
 */

const { createApp } = require("../app");

describe("Pruebas Unitarias – HU3 Inicio de sesión (Backend)", () => {
  let server;
  let baseUrl;

  // Guardar env original para no afectar otras pruebas
  const originalEnv = {
    ORACLE_USER: process.env.ORACLE_USER,
    ORACLE_PASS: process.env.ORACLE_PASS,
    ORACLE_CONN: process.env.ORACLE_CONN,
  };

  beforeAll(() => {
    // 1) Forzamos un error REAL de conexión/configuración Oracle (sin mocks)
    process.env.ORACLE_USER = "usuario_invalido_test";
    process.env.ORACLE_PASS = "pass_invalida_test";
    process.env.ORACLE_CONN = "host_inexistente:9999/servicio_invalido";

    // 2) Creamos la app y levantamos servidor temporal
    const app = createApp();
    server = app.listen(0);

    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    // 3) Cerramos servidor temporal
    server.close();

    // 4) Restauramos env original
    process.env.ORACLE_USER = originalEnv.ORACLE_USER;
    process.env.ORACLE_PASS = originalEnv.ORACLE_PASS;
    process.env.ORACLE_CONN = originalEnv.ORACLE_CONN;
  });

  test("Escenario 4 (P4) – Debe retornar 500 cuando falla Oracle y se ejecuta el catch", async () => {
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

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Error al iniciar sesión" });
  });
});