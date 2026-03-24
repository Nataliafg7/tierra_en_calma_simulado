// ================= MOCKS =================
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
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

describe("HU1 - Backend - P1: Campos incompletos", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  test("Debe responder 400 cuando faltan campos obligatorios", async () => {
    // Arrange:
    // Se envía un cuerpo incompleto para validar que el flujo se detiene
    const body = {
      id_usuario: 1,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com"
      // falta contrasena
    };

    // Act:
    const res = await request(app).post("/api/register").send(body);

    // Assert:
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Todos los campos son obligatorios"
    });

    // No debe tocar la base de datos
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});