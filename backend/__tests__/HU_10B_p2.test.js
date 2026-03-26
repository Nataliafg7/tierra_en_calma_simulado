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

describe("HU10B P2 - POST /api/registrar-planta", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("debe responder 400 cuando faltan datos y no debe acceder a la base de datos", async () => {
    /*
      Objetivo:
      Verificar la validación previa de datos.

      Mock utilizado:
      - oracledb.getConnection: queda mockeado, pero no debe ser llamado.

      Qué se valida:
      - estado HTTP 400
      - mensaje de error esperado
      - que no se llama a getConnection
    */

    // Arrange
    const body = {
      id_usuario: 10,
    };

    // Act
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Datos incompletos para registrar la planta",
    });

    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});