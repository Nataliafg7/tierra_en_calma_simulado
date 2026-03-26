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

describe("HU8B P2 - GET /api/plantas", () => {
  let app;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test("debe responder 500 cuando ocurre un error al obtener la conexión", async () => {
    /*
      Objetivo:
      Verificar el comportamiento del endpoint cuando falla getConnection.

      Mock utilizado:
      - oracledb.getConnection: rechaza con un error simulado.

      Qué se valida:
      - estado HTTP 500
      - mensaje de error esperado
      - que sí se intentó obtener conexión
      - que se registró el error por consola

      Observación:
      En este escenario no existe conexión, por eso no hay cierre.
    */

    // Arrange
    oracledb.getConnection.mockRejectedValue(new Error("Fallo de conexión"));

    // Act
    const response = await request(app).get("/api/plantas");

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error al obtener la lista de plantas",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});