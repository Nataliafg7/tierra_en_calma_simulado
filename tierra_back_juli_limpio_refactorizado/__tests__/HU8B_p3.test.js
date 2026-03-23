const request = require("supertest");

describe("HU8 – Backend – Escenarios P3 y P4 (con mock justificado) – GET /api/plantas", () => {
  // Nota: Usamos mock porque estas fallas (execute/close) NO son reproducibles de forma controlada
  // sin modificar el server o el entorno de BD.

  beforeEach(() => {
    jest.resetModules(); // importante para que el require('../app') use el mock actualizado
  });

  test("P3 – Debe retornar 500 cuando falla connection.execute (error de consulta)", async () => {
    // Mock de oracledb para forzar fallo en execute
    jest.doMock("oracledb", () => ({
      OUT_FORMAT_OBJECT: "OUT_FORMAT_OBJECT",
      getConnection: jest.fn().mockResolvedValue({
        execute: jest.fn().mockRejectedValue(new Error("SQL execution failed")),
        close: jest.fn().mockResolvedValue(undefined),
      }),
    }));

    const { createApp } = require("../app");
    const app = createApp();

    const res = await request(app).get("/api/plantas");

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ error: "Error al obtener la lista de plantas" });
  });

  test("P4 – Debe retornar 500 cuando falla connection.close (error al cerrar conexión)", async () => {
    // Mock de oracledb para forzar fallo en close
    jest.doMock("oracledb", () => ({
      OUT_FORMAT_OBJECT: "OUT_FORMAT_OBJECT",
      getConnection: jest.fn().mockResolvedValue({
        execute: jest.fn().mockResolvedValue({ rows: [{ ID_PLANTA: 1, NOMBRE_COMUN: "Aloe" }] }),
        close: jest.fn().mockRejectedValue(new Error("Close failed")),
      }),
    }));

    const { createApp } = require("../app");
    const app = createApp();

    const res = await request(app).get("/api/plantas");

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ error: "Error al obtener la lista de plantas" });
  });
});