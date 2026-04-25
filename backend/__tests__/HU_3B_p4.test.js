// ================= MOCKS =================
// Mock de módulo para reemplazar oracledb y simular la consulta sin usar BD real
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

// Mocks necesarios porque app.js los importa al inicializar la aplicación
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

describe("HU3 - Backend - P4: credenciales inválidas", () => {
  let app;
  let executeMock;
  let closeMock;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: garantiza independencia entre ejecuciones
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
    // ================= ARRANGE =================
    // Se preparan credenciales que no existen en la consulta simulada
    // FIRST: el resultado es repetible porque rows siempre devuelve un arreglo vacío
    const credencialesInvalidas = {
      correo_electronico: "juliana@correo.com",
      contrasena: "incorrecta",
    };

    // ================= ACT =================
    // Se ejecuta el endpoint de inicio de sesión
    const response = await request(app)
      .post("/api/login")
      .send(credencialesInvalidas);

    // ================= ASSERT =================
    // Se valida que el sistema rechace el login por credenciales inválidas
    expect(response.status).toBe(401);
    // Fluent assertion: expresa claramente el código HTTP esperado para autenticación fallida

    expect(response.body).toEqual({
      message: "Credenciales inválidas",
    });
    // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint
    // FIRST: la prueba es self-validating porque el resultado esperado queda definido en asserts

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó consultar la base de datos una sola vez

    expect(executeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta de login se ejecutó una sola vez

    expect(closeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró aun cuando las credenciales fueron inválidas

    // FIRST: prueba rápida, independiente, repetible y sin dependencia de una BD real
  });
});