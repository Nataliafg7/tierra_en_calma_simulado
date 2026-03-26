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

describe("HU11B_p1 - GET /api/mis-plantas con header inválido", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("debe responder 400 y no consultar la base de datos cuando x-user-id no es entero", async () => {
    // Arrange:
    // Se prepara una petición con un header inválido para comprobar que
    // la validación detiene el flujo antes de abrir conexión.
    const headerInvalido = "abc";

    // Act:
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", headerInvalido);

    // Assert:
    // Se valida que el endpoint rechace la petición y no toque Oracle.
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "x-user-id inválido" });

    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});