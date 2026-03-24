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

describe("HU10B P3 - POST /api/registrar-planta", () => {
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

  test("debe responder 500 cuando falla la obtención de la conexión", async () => {
    /*
      Objetivo:
      Verificar el comportamiento cuando falla getConnection.

      Mock utilizado:
      - oracledb.getConnection: rechaza con error simulado.

      Qué se valida:
      - estado HTTP 500
      - mensaje de error esperado
      - llamada a getConnection
      - registro del error en consola
    */

    // Arrange
    oracledb.getConnection.mockRejectedValue(new Error("Fallo de conexión"));

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
    expect(errorSpy).toHaveBeenCalled();
  });
});