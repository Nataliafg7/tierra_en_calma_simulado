/**
 * HU18B - P5
 * Camino: B1 → B2(No) → B4(error BD) → B11 → B12 → B13 → B14
 * Objetivo: Forzar error real de conexión Oracle sin mocks, usando connectString inválido.
 */

jest.setTimeout(60000);

describe("HU18 – Backend – P5 (error conexión Oracle)", () => {
  test("Debe retornar ok:false cuando falla la conexión/consulta", async () => {
    const originalConn = process.env.ORACLE_CONN;

    // Forzamos connectString inválido
    process.env.ORACLE_CONN = "INVALID_CONN_STRING";

    // Re-cargar módulos para que tomen el env nuevo
    jest.resetModules();
    const request = require("supertest");
    const app = require("../server");

    const res = await request(app)
      .post("/api/verificar-condiciones")
      .send({ id_planta_usuario: 900003 });


    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.mensaje).toBe("Error al ejecutar la verificación.");

    // Restaurar env
    process.env.ORACLE_CONN = originalConn;
  });
});