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

describe("HU10B P4 - POST /api/registrar-planta", () => {
  let app;
  let connectionMock;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn(),
    };

    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test("debe responder 500 cuando falla el INSERT y luego cerrar la conexión", async () => {
    /*
      Objetivo:
      Verificar el flujo donde la conexión sí se obtiene,
      pero falla la ejecución del INSERT.

      Mock utilizado:
      - oracledb.getConnection: devuelve conexión simulada.
      - connection.execute: rechaza con error simulado.
      - connection.close: resuelve correctamente.

      Qué se valida:
      - estado HTTP 500
      - mensaje de error esperado
      - llamada a execute
      - llamada a close desde finally
      - registro del error por consola
    */

    // Arrange
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockRejectedValue(new Error("Error en execute"));
    connectionMock.close.mockResolvedValue();

    // Act
    const response = await request(app)
      .post("/api/registrar-planta")
      .send({ id_usuario: 10, id_planta: 3 });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error al registrar planta",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});