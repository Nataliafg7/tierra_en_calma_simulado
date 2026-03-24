// ================= MOCKS =================
// Tipos de mock usados:
// - Mock de módulo
// - jest.fn
// - Mock de implementación para devolver rows vacías
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

describe("HU3 - Backend - P4: credenciales inválidas", () => {
  let app;
  let executeMock;
  let closeMock;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    executeMock = jest.fn().mockResolvedValue({
      rows: [],
    });

    closeMock = jest.fn().mockResolvedValue();

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });
  });

  test("Debe responder 401 cuando la consulta no devuelve usuarios", async () => {
    // Arrange:
    const body = {
      correo_electronico: "juliana@correo.com",
      contrasena: "incorrecta",
    };

    // Act:
    const res = await request(app).post("/api/login").send(body);

    // Assert:
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      message: "Credenciales inválidas",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});