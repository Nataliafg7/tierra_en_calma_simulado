const request = require("supertest");
const oracledb = require("oracledb");

jest.mock("oracledb");

describe("HU1 – Backend – Escenario 7 (P7) – Error en execute con cierre correcto", () => {
  let app;
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn()
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockRejectedValue(
      new Error("Fallo en execute")
    );
    connectionMock.close.mockResolvedValue();

    const { createApp } = require("../app");
    app = createApp();
  });

  test("P7 – POST /api/register debe responder 500 cuando falla execute y luego cerrar la conexión", async () => {
    // Arrange:
    // Este escenario usa mock de implementación fallida para execute
    // y cierre exitoso para validar el finally.
    const payload = {
      id_usuario: 107,
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
      detalles: "Fallo en execute"
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });
});