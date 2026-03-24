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

describe("HU1 - Backend - P3: Contraseña inválida", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  test("Debe responder 400 cuando la contraseña es menor a 8 caracteres", async () => {
    // Arrange:
    const body = {
      id_usuario: 3,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "1234"
    };

    // Act:
    const res = await request(app).post("/api/register").send(body);

    // Assert:
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "La contraseña debe tener al menos 8 caracteres"
    });

    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});