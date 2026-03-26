const request = require("supertest");

jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

jest.mock("../mqttService", () => ({}));
jest.mock("../cuidadosService", () => ({ crearCuidado: jest.fn() }));
jest.mock("../pkgCentralService", () => ({ verificarCondiciones: jest.fn() }));

jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));

jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));

jest.mock("yamljs", () => ({
  load: jest.fn(() => ({})),
}));

const oracledb = require("oracledb");
const { createApp } = require("../app");

describe("HU11B_p6 - GET /api/mis-plantas con error al cerrar conexión", () => {
  let app;
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn(),
    };
  });

  test("debe responder 200 aunque falle el close, dejando trazabilidad del error", async () => {
    // Arrange:
    // La consulta sale bien, pero el cierre de conexión falla dentro del finally.
    const filas = [
      {
        ID_PLANTA_USUARIO: 20,
        ID_PLANTA: 4,
        NOMBRE_COMUN: "Lengua de suegra",
        NOMBRE_CIENTIFICO: "Sansevieria trifasciata",
      },
    ];

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    connectionMock.execute.mockResolvedValue({ rows: filas });
    connectionMock.close.mockRejectedValue(new Error("fallo al cerrar"));

    oracledb.getConnection.mockResolvedValue(connectionMock);

    // Act:
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "9");

    // Assert:
    // Aunque close falle, la respuesta principal ya fue exitosa.
    expect(response.status).toBe(200);
    expect(response.body).toEqual(filas);

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});