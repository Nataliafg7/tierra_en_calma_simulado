/**
 * HU10 (Backend) - Asociación de planta
 * Escenario 2 (P2): Error en conexión a Oracle (getConnection falla)
 * Archivo: HU10B_p2.test.js
 *
 */

describe("Pruebas Unitarias Backend – HU10 Asociación de planta", () => {
  let server;
  let baseUrl;

  // Guardamos env original para restaurar al final
  const originalEnv = {
    ORACLE_USER: process.env.ORACLE_USER,
    ORACLE_PASS: process.env.ORACLE_PASS,
    ORACLE_CONN: process.env.ORACLE_CONN,
  };

  beforeAll(() => {
    // 1) Forzamos credenciales inválidas ANTES de crear la app
    process.env.ORACLE_USER = "USUARIO_INEXISTENTE";
    process.env.ORACLE_PASS = "CLAVE_INCORRECTA";
    process.env.ORACLE_CONN = "CONN_INVALIDA";

    // 2) Importamos la app DESPUÉS de cambiar env (para que tome esos valores)
    jest.resetModules();
    const { createApp } = require("../app");

    // 3) Levantamos servidor temporal
    const app = createApp();
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    // Cerramos servidor
    server.close();

    // Restauramos env para no dañar otras pruebas
    process.env.ORACLE_USER = originalEnv.ORACLE_USER;
    process.env.ORACLE_PASS = originalEnv.ORACLE_PASS;
    process.env.ORACLE_CONN = originalEnv.ORACLE_CONN;
  });

  test("Escenario 2 (P2) – Debe retornar 500 cuando falla la conexión a Oracle", async () => {
    const payload = {
      id_usuario: 1,
      id_planta: 1,
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