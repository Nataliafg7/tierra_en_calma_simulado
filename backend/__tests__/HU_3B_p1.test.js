// ================= MOCKS =================
// Tipo de mock usado:
// - Mock de módulo para reemplazar oracledb completo
// - Se evita cargar el módulo real y se controla getConnection desde la prueba
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
}));

// Estos módulos se mockean porque app.js los carga al importarse,
// aunque esta prueba solo evalúa /api/login
jest.mock("../mqttService", () => ({}));
jest.mock("../cuidadosService", () => ({ crearCuidado: jest.fn() }));
jest.mock("../pkgCentralService", () => ({ verificarCondiciones: jest.fn() }));
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));
jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));
jest.mock("yamljs", () => ({ load: jest.fn(() => ({})) }));

// ================= IMPORTS =================
const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

describe("HU3 - Backend - P1: campos incompletos", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("Debe responder 400 cuando faltan correo o contraseña", async () => {
    // Arrange:
    // Se envía un body incompleto para validar que el flujo se detenga
    // antes de intentar abrir la conexión.
    const body = {
      correo_electronico: "juliana@correo.com",
    };

    // Act:
    const res = await request(app).post("/api/login").send(body);

    // Assert:
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "El correo y la contraseña son obligatorios",
    });

    // Como falló una validación previa, no debe tocar la base de datos.
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});