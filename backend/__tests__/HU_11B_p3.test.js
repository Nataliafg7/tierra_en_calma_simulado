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

describe("HU11B_p3 - GET /api/mis-plantas exitoso con rows nulo", () => {
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

  test("debe responder 200 con arreglo vacío cuando result.rows es null", async () => {
    // Arrange:
    // Se fuerza el caso donde Oracle responde sin filas explícitas.
    // El endpoint debe normalizarlo a un arreglo vacío.
    connectionMock.execute.mockResolvedValue({ rows: null });
    connectionMock.close.mockResolvedValue();

    oracledb.getConnection.mockResolvedValue(connectionMock);

    // Act:
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "8");

    // Assert:
    // Se espera una respuesta exitosa con arreglo vacío y cierre correcto.
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });
});