// ================= MOCKS =================
// Mock de módulo completo de oracledb para evitar conexión real
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
}));

// Mocks necesarios porque app.js los importa, aunque no se usen directamente aquí
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
    jest.clearAllMocks(); // Garantiza independencia entre pruebas (FIRST: Independent)
    app = createApp();
  });

  test("Debe responder 400 cuando faltan correo o contraseña", async () => {
    // ================= ARRANGE =================
    // Se prepara un request incompleto para forzar validación temprana
    // FIRST (Fast): no depende de BD real
    const bodyInvalido = {
      correo_electronico: "juliana@correo.com",
    };

    // ================= ACT =================
    // Se ejecuta el endpoint de login
    const response = await request(app)
      .post("/api/login")
      .send(bodyInvalido);

    // ================= ASSERT =================
    // AAA: Se valida el resultado esperado del endpoint

    expect(response.status).toBe(400); 
    // Fluent assertion: validación directa, clara y sin ambigüedad del código HTTP esperado

    expect(response.body).toEqual({
      message: "El correo y la contraseña son obligatorios",
    }); 
    // Fluent assertion: valida el contrato exacto de respuesta (mensaje esperado)
    // Hace la prueba expresiva, legible y fácil de defender

    // FIRST (Self-validating): el test se valida solo, no requiere inspección manual

    expect(oracledb.getConnection).not.toHaveBeenCalled(); 
    // Fluent assertion: valida comportamiento interno importante
    // Se asegura que la validación corta el flujo antes de acceder a BD (optimización + seguridad)

    // FIRST (Repeatable): al usar mocks, el resultado será siempre el mismo
  });
});