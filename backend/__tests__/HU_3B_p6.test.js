// ================= MOCKS =================
// Mock de módulo para controlar oracledb sin usar una conexión real
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

jest.mock("../mqttService", () => ({}));
jest.mock("../cuidadosService", () => ({}));
jest.mock("../pkgCentralService", () => ({}));
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));
jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));
jest.mock("yamljs", () => ({ load: jest.fn() }));

// ================= IMPORTS =================
const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

describe("HU3 - Backend - P6: Error durante close en login", () => {
  let app;
  let executeMock;
  let closeMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita que llamadas anteriores afecten esta prueba
    app = createApp();

    executeMock = jest.fn().mockResolvedValue({
      rows: [
        {
          ID_USUARIO: 1,
          NOMBRE: "Admin",
          APELLIDO: "Principal",
          CORREO_ELECTRONICO: "admin@tierraencalma.com",
          CONTRASENA: "admin123",
          ROL: "admin",
        },
      ],
    });

    closeMock = jest.fn().mockRejectedValue(new Error("Error cerrando conexión"));

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });

    // Spy para validar que el error se registra sin mostrarlo en consola durante la prueba
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore(); // FIRST: deja console.error limpio para otras pruebas
  });

  test("Debe responder correctamente aunque falle el cierre de la conexión", async () => {
    // ================= ARRANGE =================
    // Se prepara un login válido para que el fallo ocurra únicamente en close
    // FIRST: la prueba es rápida y repetible porque no depende de Oracle real
    const loginValido = {
      correo_electronico: "admin@tierraencalma.com",
      contrasena: "admin123",
    };

    // ================= ACT =================
    // Se ejecuta el endpoint de inicio de sesión
    const response = await request(app)
      .post("/api/login")
      .send(loginValido);

    // ================= ASSERT =================
    // Se valida que el error secundario en close no dañe la respuesta principal del login
    expect(response.status).toBe(200);
    // Fluent assertion: expresa de forma clara el código HTTP esperado para un login exitoso

    expect(response.body).toMatchObject({
      message: "Login exitoso",
      role: "admin",
    });
    // Fluent assertion: valida el contrato principal sin volver frágil la prueba por campos adicionales

    expect(response.body.user).toMatchObject({
      ID_USUARIO: 1,
      CORREO_ELECTRONICO: "admin@tierraencalma.com",
    });
    // Fluent assertion: valida los datos clave del usuario autenticado sin depender de todo el objeto

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se solicitó una sola vez

    expect(executeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta de login se ejecutó una sola vez

    expect(closeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que el cierre se intentó, aunque haya fallado

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al cerrar la conexión en login:",
      expect.any(Error)
    );
    // Fluent assertion: valida el manejo controlado del error sin depender de una instancia exacta

    // FIRST: la prueba es Fast, Independent, Repeatable, Self-validating y Timely
  });
});