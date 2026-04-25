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

describe("HU3 - Backend - P8: error en execute y también en close", () => {
  let app;
  let executeMock;
  let closeMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
    app = createApp();

    executeMock = jest.fn().mockRejectedValue(new Error("Fallo en execute"));
    closeMock = jest.fn().mockRejectedValue(new Error("Fallo al cerrar conexión"));

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });

    // Spy para validar el registro del error de cierre sin mostrarlo en consola
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore(); // FIRST: restaura console.error para no afectar otros tests
  });

  test("Debe responder 500 cuando falla execute y además falla el cierre", async () => {
    // ================= ARRANGE =================
    // Se prepara un login válido para que el error principal ocurra en execute
    // FIRST: los fallos de execute y close están controlados por mocks
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
    // Se valida que el endpoint conserve el error principal del login
    expect(response.status).toBe(500);
    // Fluent assertion: expresa claramente el código HTTP esperado ante una falla interna

    expect(response.body).toEqual({
      error: "Error al iniciar sesión",
    });
    // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se solicitó la conexión una sola vez

    expect(executeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta fallida fue intentada una sola vez

    expect(closeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que el cierre se intentó aunque también fallara

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al cerrar la conexión en login:",
      expect.any(Error)
    );
    // Fluent assertion: valida el manejo flexible del error secundario sin depender de una instancia exacta

    // FIRST: prueba rápida, independiente, repetible, self-validating y enfocada al escenario P8
  });
});