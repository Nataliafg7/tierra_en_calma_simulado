// ================= MOCKS =================
// Tipos de mock usados:
// - Mock de módulo
// - jest.fn
// - Mock de implementación:
//   execute responde bien y close falla
// - También se usa spy sobre console.error para verificar el log
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

describe("HU3 - Backend - P5: login exitoso con error en close", () => {
  let app;
  let executeMock;
  let closeMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    executeMock = jest.fn().mockResolvedValue({
      rows: [
        {
          ID_USUARIO: 10,
          NOMBRE: "Juliana",
          APELLIDO: "Florez",
          TELEFONO: "3001234567",
          CORREO_ELECTRONICO: "juliana@correo.com",
        },
      ],
    });

    closeMock = jest.fn().mockRejectedValue(new Error("Error al cerrar conexión"));

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Debe responder 200 aunque falle el cierre de la conexión en finally", async () => {
    // Arrange:
    const body = {
      correo_electronico: "juliana@correo.com",
      contrasena: "clave1234",
    };

    // Act:
    const res = await request(app).post("/api/login").send(body);

    // Assert:
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Login exitoso",
      user: {
        ID_USUARIO: 10,
        NOMBRE: "Juliana",
        APELLIDO: "Florez",
        TELEFONO: "3001234567",
        CORREO_ELECTRONICO: "juliana@correo.com",
      },
      role: "user",
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