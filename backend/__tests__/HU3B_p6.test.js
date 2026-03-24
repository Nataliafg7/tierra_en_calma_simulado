// ================= MOCKS =================
// Tipos de mock usados:
// - Mock de módulo
// - Mock de implementación fallida en getConnection
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
jest.mock("yamljs", () => ({ load: jest.fn(() => ({})) }));

const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

describe("HU3 - Backend - P6: error en getConnection", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    oracledb.getConnection.mockRejectedValue(new Error("Fallo al obtener conexión"));
  });

  test("Debe responder 500 cuando no se puede abrir la conexión a Oracle", async () => {
    // Arrange:
    const body = {
      correo_electronico: "juliana@correo.com",
      contrasena: "clave1234",
    };

    // Act:
    const res = await request(app).post("/api/login").send(body);

    // Assert:
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Error al iniciar sesión",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  });
});