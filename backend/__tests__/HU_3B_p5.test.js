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

describe("HU3 - Backend - P5: login exitoso con error en close", () => {
  let app;
  let executeMock;
  let closeMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
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

    // Spy para validar que el error de cierre se registra sin mostrarlo en consola durante el test
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Debe responder 200 aunque falle el cierre de la conexión en finally", async () => {
    // ================= ARRANGE =================
    // Se prepara un login válido para que el fallo ocurra solo al cerrar la conexión
    // FIRST: el resultado es repetible porque execute y close están completamente controlados
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
    // Se valida que el error secundario en close no afecte la respuesta principal
    expect(response.status).toBe(200);
    // Fluent assertion: expresa claramente que el login debe conservar una respuesta exitosa

    expect(response.body).toEqual({
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
    // Fluent assertion: valida el contrato completo de salida, incluyendo usuario autenticado y rol

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se solicitó conexión una sola vez

    expect(executeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta de login sí se ejecutó

    expect(closeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que el cierre se intentó aunque luego fallara

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al cerrar la conexión en login:",
      expect.any(Error)
    );
    // Fluent assertion: valida el manejo flexible del error sin depender de una instancia exacta

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios asserts
  });
});