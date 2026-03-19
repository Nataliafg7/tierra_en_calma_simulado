const request = require("supertest");

describe("HU8 – Backend – Escenario 2 (P2) – Falla al abrir conexión (GET /api/plantas)", () => {
  const ORIGINAL_ENV = { ...process.env };

  jest.setTimeout(30000);

  afterEach(() => {
    // Restaurar variables de entorno luego de cada subprueba
    process.env = { ...ORIGINAL_ENV };
    // Limpiar cache de require para que createApp lea el env actualizado en la próxima subprueba
    jest.resetModules();
  });

  test("P2.1 – Debe retornar 500 cuando ORACLE_CONN es inválido (fallo real de conexión)", async () => {
    process.env.ORACLE_CONN = "INVALID_CONN_STRING";


    const { createApp } = require("../app");
    const app = createApp();

    const res = await request(app).get("/api/plantas");

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ error: "Error al obtener la lista de plantas" });
  });

  test("P2.2 – Debe retornar 500 cuando faltan credenciales ORACLE_USER/ORACLE_PASS", async () => {
    delete process.env.ORACLE_USER;
    delete process.env.ORACLE_PASS;


    const { createApp } = require("../app");
    const app = createApp();

    const res = await request(app).get("/api/plantas");

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ error: "Error al obtener la lista de plantas" });
  });
});