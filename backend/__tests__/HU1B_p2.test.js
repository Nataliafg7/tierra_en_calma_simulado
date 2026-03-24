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

describe("HU1 - Backend - P2: Correo inválido", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  test("Debe responder 400 cuando el correo es inválido", async () => {
    // Arrange:
    const body = {
      id_usuario: 2,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "correo-invalido",
      contrasena: "12345678"
    };

    // Act:
    const res = await request(app).post("/api/register").send(body);

    // Assert:
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "El correo electrónico no es válido"
    });

    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});