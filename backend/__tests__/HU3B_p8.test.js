// ================= MOCKS =================
// Tipos de mock usados:
// - Mock de módulo
// - jest.fn
// - Mock secuencial del flujo:
//   primero execute falla dentro del try
//   y luego close falla dentro del finally
// - Spy sobre console.error para comprobar el registro del error
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

describe("HU3 - Backend - P8: error en execute y también en close", () => {
  let app;
  let executeMock;
  let closeMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    executeMock = jest.fn().mockRejectedValue(new Error("Fallo en execute"));
    closeMock = jest.fn().mockRejectedValue(new Error("Fallo al cerrar conexión"));

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Debe responder 500 cuando falla execute y además falla el cierre", async () => {
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
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al cerrar la conexión en login:",
      expect.any(Error)
    );
  });
});