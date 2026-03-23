const request = require("supertest");
const oracledb = require("oracledb");

jest.mock("oracledb");

describe("HU1 – Backend – Escenario 8 (P8) – Error en execute y también en close", () => {
  let app;
  let connectionMock;
  let consoleSpy;

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
    connectionMock.close.mockRejectedValue(
      new Error("Fallo al cerrar conexión")
    );

    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { createApp } = require("../app");
    app = createApp();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("P8 – POST /api/register debe responder 500 cuando falla execute y además close", async () => {
    // Arrange:
    // Aquí se aplica un mock secuencial del flujo:
    // primero se obtiene conexión,
    // luego execute falla,
    // y finalmente close también falla dentro del finally.
    const payload = {
      id_usuario: 108,
      nombre: "Juliana",
      apellido: "Flórez",
      telefono: "3001234567",
      correo_electronico: "juliana@correo.com",
      contrasena: "clave1234"
    };

    // Act:
    const res = await request(app).post("/api/register").send(payload);

    // Assert:
    // La respuesta principal debe seguir siendo 500 por el error de execute.
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Error al registrar usuario",
      detalles: "Fallo en execute"
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error cerrando conexión",
      expect.any(Error)
    );
  });
});