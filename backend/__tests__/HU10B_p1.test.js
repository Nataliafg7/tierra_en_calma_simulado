const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

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

describe("HU10B P1 - POST /api/registrar-planta", () => {
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

  test("debe responder 200 cuando la planta se registra correctamente", async () => {
    /*
      Objetivo:
      Verificar el flujo exitoso del endpoint /api/registrar-planta.

      Mock utilizado:
      - oracledb.getConnection: devuelve una conexión simulada.
      - connection.execute: resuelve correctamente el INSERT.
      - connection.close: resuelve correctamente.

      Qué se valida:
      - estado HTTP 200
      - mensaje de éxito
      - llamada a getConnection
      - llamada a execute con SQL, parámetros y autoCommit esperados
      - llamada a close al finalizar
    */

    // Arrange
    const body = {
      id_usuario: 10,
      id_planta: 3,
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({});
    connectionMock.close.mockResolvedValue();

    // Act
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Planta registrada con éxito en tu jardín",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
expect(connectionMock.execute).toHaveBeenCalledWith(
  expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.PLANTAS_USUARIO"),
  { id_planta: 3, id_usuario: 10 },
  { autoCommit: true }
);    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });
});