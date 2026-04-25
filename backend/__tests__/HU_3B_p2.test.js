// ================= MOCKS =================
// Mock de módulo para reemplazar oracledb y controlar la conexión desde la prueba
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

// Mocks necesarios porque app.js los carga al inicializar la aplicación
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

describe("HU3 - Backend - P3: login exitoso admin", () => {
  let app;
  let executeMock;
  let closeMock;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: mantiene la prueba independiente y repetible
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
    // ================= ARRANGE =================
    // Se prepara un login válido con el correo definido para el administrador
    // FIRST: no se usa una BD real, el resultado depende solo del mock configurado
    const loginAdmin = {
      correo_electronico: "admin@tierraencalma.com",
      contrasena: "clave1234",
    };

    // ================= ACT =================
    // Se ejecuta el endpoint de inicio de sesión
    const response = await request(app)
      .post("/api/login")
      .send(loginAdmin);

    // ================= ASSERT =================
    // Se valida que el endpoint responda correctamente ante credenciales válidas
    expect(response.status).toBe(200);
    // Fluent assertion: expresa de forma directa el código HTTP esperado para un login exitoso

    expect(response.body).toEqual({
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
    // Fluent assertion: valida el contrato completo de respuesta, incluyendo usuario y rol admin
    // Hace que la prueba sea self-validating porque no requiere revisión manual del resultado

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión a BD fue solicitada una sola vez

    expect(executeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta de login se ejecutó una sola vez

    expect(closeMock).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión fue cerrada correctamente

    // FIRST: la prueba es rápida, independiente, repetible y verificable por sus propios asserts
  });
});