const request = require("supertest");
const oracledb = require("oracledb");

jest.mock("oracledb");

describe("HU1 – Backend – Escenario 6 (P6) – Error al obtener conexión", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    oracledb.getConnection.mockRejectedValue(
      new Error("Fallo al obtener conexión")
    );

    const { createApp } = require("../app");
    app = createApp();
  });

  test("P6 – POST /api/register debe responder 500 cuando falla getConnection", async () => {
    // Arrange:
    // El mock del módulo oracledb simula fallo inmediato al intentar conectarse.
    const payload = {
      id_usuario: 106,
      nombre: "Juliana",
      apellido: "Flórez",
      telefono: "3001234567",
      correo_electronico: "juliana@correo.com",
      contrasena: "clave1234"
    };

    // Act:
    const res = await request(app).post("/api/register").send(payload);

    // Assert:
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Error al registrar usuario",
      detalles: "Fallo al obtener conexión"
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  });
});