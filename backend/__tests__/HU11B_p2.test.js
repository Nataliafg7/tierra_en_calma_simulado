/**
 * HU11 - Backend - GET /api/mis-plantas
 * Escenario 2 (P2): Consulta exitosa de plantas del usuario
 *
 * Se valida el flujo principal del endpoint cuando el header x-user-id
 * contiene un identificador entero válido. El sistema debe ejecutar la
 * consulta a la base de datos y retornar una lista de plantas asociadas
 * al usuario (o una lista vacía si no existen registros).
 */

const { createApp } = require("../app");

describe("Pruebas Unitarias Backend – HU11 /api/mis-plantas – Escenario P2", () => {

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

  test("P2-A: x-user-id válido → consulta exitosa", async () => {

    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "42900093" }
    });

    expect(res.status).toBe(200);

    const body = await res.json();

    console.log("[P2-A] STATUS:", res.status);
    console.log("[P2-A] BODY:", body);

    expect(Array.isArray(body)).toBe(true);

  });


  test("P2-B: x-user-id válido pero sin plantas registradas", async () => {

    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "9999" }
    });

    expect(res.status).toBe(200);

    const body = await res.json();

    console.log("[P2-B] STATUS:", res.status);
    console.log("[P2-B] BODY:", body);

    expect(Array.isArray(body)).toBe(true);

  });

});