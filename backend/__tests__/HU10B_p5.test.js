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

describe("HU10B P5 - POST /api/registrar-planta", () => {
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

  test("debe responder 200 aunque falle el cierre de la conexión", async () => {
    /*
      Objetivo:
      Verificar que el error en close no modifique la respuesta exitosa.

      Mock utilizado:
      - oracledb.getConnection: devuelve conexión simulada.
      - connection.execute: resuelve correctamente.
      - connection.close: rechaza con error simulado.

      Qué se valida:
      - estado HTTP 200
      - mensaje de éxito
      - intento de cierre de conexión
      - registro del error de cierre en consola
    */

    // Arrange
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({});
    connectionMock.close.mockRejectedValue(new Error("Error al cerrar"));

    // Act
    const response = await request(app)
      .post("/api/registrar-planta")
      .send({ id_usuario: 10, id_planta: 3 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Planta registrada con éxito en tu jardín",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al cerrar conexión en registrar planta:",
      expect.any(Error)
    );
  });
});