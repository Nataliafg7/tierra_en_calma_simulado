// ================= MOCKS =================
// Mock de módulo para controlar oracledb sin usar una conexión real
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

describe("HU3 - Backend - P7: error en execute con close exitoso", () => {
  let app;
  let executeMock;
  let closeMock;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita que una prueba afecte a otra
    app = createApp();

    executeMock = jest.fn().mockRejectedValue(new Error("Fallo en execute"));
    closeMock = jest.fn().mockResolvedValue();

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });
  });

  test("Debe responder 500 cuando falla la consulta y luego cerrar la conexión", async () => {
    // ================= ARRANGE =================
    // Se prepara un login válido para que el error ocurra únicamente durante execute
    // FIRST: el fallo está controlado por el mock, no por una BD real
    const loginValido = {
      correo_electronico: "juliana@correo.com",
      contrasena: "clave1234",
    };

    // ================= ACT =================
    // Se ejecuta el endpoint de inicio de sesión
    const response = await request(app)
      .post("/api/login")
      .send(loginValido);

    // ================= ASSERT =================
    // Se valida que el endpoint maneje el error de consulta como error interno
    expect(response.status).toBe(500);
    // Fluent assertion: expresa claramente el código HTTP esperado ante una falla interna

    expect(response.body).toEqual({
      error: "Error al iniciar sesión",
    });
    // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se solicitó la conexión una sola vez

    expect(executeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta fue intentada una sola vez

    expect(closeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró aunque execute haya fallado

    // FIRST: prueba rápida, independiente, repetible, self-validating y enfocada al escenario P7
  });
});