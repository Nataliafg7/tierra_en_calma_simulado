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

describe("HU11B_p4 - GET /api/mis-plantas con error en getConnection", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("debe responder 500 cuando falla la apertura de conexión", async () => {
    // Arrange:
    // Se simula un fallo al intentar conectarse con Oracle.
    oracledb.getConnection.mockRejectedValue(new Error("fallo al conectar"));

    // Act:
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "3");

    // Assert:
    // Se valida la respuesta de error y que no hubo execute ni close.
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error al obtener las plantas del usuario",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  });
});