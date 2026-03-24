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

describe("HU11B_p2 - GET /api/mis-plantas exitoso con filas", () => {
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

  test("debe responder 200 con las plantas del usuario y cerrar la conexión", async () => {
    // Arrange:
    // Se simula una consulta exitosa devolviendo plantas asociadas al usuario.
    const filas = [
      {
        ID_PLANTA_USUARIO: 10,
        ID_PLANTA: 1,
        NOMBRE_COMUN: "Monstera",
        NOMBRE_CIENTIFICO: "Monstera deliciosa",
      },
      {
        ID_PLANTA_USUARIO: 11,
        ID_PLANTA: 2,
        NOMBRE_COMUN: "Potus",
        NOMBRE_CIENTIFICO: "Epipremnum aureum",
      },
    ];

    connectionMock.execute.mockResolvedValue({ rows: filas });
    connectionMock.close.mockResolvedValue();

    oracledb.getConnection.mockResolvedValue(connectionMock);

    // Act:
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "5");

    // Assert:
    // Se valida estado, cuerpo y uso correcto de Oracle.
    expect(response.status).toBe(200);
    expect(response.body).toEqual(filas);

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("FROM TIERRA_EN_CALMA.PLANTAS_USUARIO pu"),
      { id_usuario: 5 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });
});