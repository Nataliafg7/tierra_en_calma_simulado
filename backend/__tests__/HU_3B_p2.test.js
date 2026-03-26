// ================= MOCKS =================
// Tipos de mock usados:
// - Mock de módulo
// - jest.fn
// - Mock de implementación exitosa
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

describe("HU3 - Backend - P3: login exitoso admin", () => {
  let app;
  let executeMock;
  let closeMock;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    executeMock = jest.fn().mockResolvedValue({
      rows: [
        {
          ID_USUARIO: 1,
          NOMBRE: "Admin",
          APELLIDO: "Principal",
          TELEFONO: "3000000000",
          CORREO_ELECTRONICO: "admin@tierraencalma.com",
        },
      ],
    });

    closeMock = jest.fn().mockResolvedValue();

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });
  });

  test("Debe responder 200 y asignar role admin cuando el correo corresponde al administrador", async () => {
    // Arrange:
    const body = {
      correo_electronico: "admin@tierraencalma.com",
      contrasena: "clave1234",
    };

    // Act:
    const res = await request(app).post("/api/login").send(body);

    // Assert:
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Login exitoso",
      user: {
        ID_USUARIO: 1,
        NOMBRE: "Admin",
        APELLIDO: "Principal",
        TELEFONO: "3000000000",
        CORREO_ELECTRONICO: "admin@tierraencalma.com",
      },
      role: "admin",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});