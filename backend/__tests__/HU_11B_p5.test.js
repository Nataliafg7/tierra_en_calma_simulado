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

describe("HU11B_p5 - GET /api/mis-plantas con error en execute", () => {
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

  test("debe responder 500 cuando falla la consulta y aun así cerrar la conexión", async () => {
    // Arrange:
    // Se simula una conexión exitosa, pero con error durante el execute.
    connectionMock.execute.mockRejectedValue(new Error("fallo en execute"));
    connectionMock.close.mockResolvedValue();

    oracledb.getConnection.mockResolvedValue(connectionMock);

    // Act:
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "6");

    // Assert:
    // El endpoint debe responder 500 y ejecutar el cierre en finally.
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error al obtener las plantas del usuario",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });
});