/**
 * HU11 - Backend - GET /api/mis-plantas
 * Escenario 1 (P1): Validación del header x-user-id
 *
 * Qué pruebo aquí:
 * - Validar que el endpoint rechace entradas inválidas en x-user-id (camino P1 del CFG).
 * - Además, probar casos límite (0 y negativo) para detectar validaciones faltantes.
 *
 * Cómo lo pruebo:
 * 1) Levanto un servidor temporal con createApp() (sin tocar el server real).
 * 2) Hago peticiones HTTP reales con fetch a /api/mis-plantas.
 * 3) Envío valores inválidos en el header y verifico:
 *    - Para casos claramente inválidos => espero HTTP 400 y JSON exacto.
 *    - Para casos límite (0 y negativos) => registro evidencia, porque hoy el código los acepta.
 *
 * Hallazgo esperado (mejora):
 * - El código actual solo valida Number.isInteger(id_usuario).
 * - Eso permite que 0 y valores negativos pasen como "válidos" y el endpoint responda 200 [].
 * - Idealmente debería validar también id_usuario > 0.
 */

const { createApp } = require("../app"); // ajusta si tu ruta cambia

describe("Pruebas Unitarias Backend – HU11 /api/mis-plantas – P1 (validación header)", () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    const app = createApp();
    server = app.listen(0); // puerto libre automático
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  test("P1-A: x-user-id no numérico ('abc') => 400", async () => {
    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "abc" },
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: "x-user-id inválido" });
  });

  test("P1-B: x-user-id decimal ('10.5') => 400", async () => {
    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "10.5" },
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: "x-user-id inválido" });
  });

  test("P1-C: x-user-id ausente (no envío el header) => 400", async () => {
    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: "x-user-id inválido" });
  });

  test("P1-D (caso límite): x-user-id negativo (-5) => evidencia de validación faltante", async () => {
    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "-5" },
    });

    const body = await res.json();

    // Evidencia real el endpoint responde 200 con [].
    // Esto ocurre porque Number.isInteger(-5) es true y el backend no valida id_usuario > 0.
    console.log("[P1-D] STATUS:", res.status);
    console.log("[P1-D] BODY:", body);


    expect([200, 400, 500]).toContain(res.status);
  });

  test("P1-E (caso límite): x-user-id igual a 0 => evidencia de validación faltante", async () => {
    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "0" },
    });

    const body = await res.json();

    // el endpoint responde 200 con [].
    // Esto ocurre porque Number('')/Number('0') puede producir 0 y Number.isInteger(0) es true.
    console.log("[P1-E] STATUS:", res.status);
    console.log("[P1-E] BODY:", body);

    expect([200, 400, 500]).toContain(res.status);
  });

 
   test("P1-F (mejora): debería rechazar id <= 0 con 400", async () => {
      const res = await fetch(`${baseUrl}/api/mis-plantas`, {
        method: "GET",
        headers: { "x-user-id": "0" },
      });
      expect(res.status).toBe(400);
    });
   
});