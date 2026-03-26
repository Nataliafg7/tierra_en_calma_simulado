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

describe("HU1 - Backend - P6: Error en getConnection", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    oracledb.getConnection.mockRejectedValue(new Error("Fallo al obtener conexión"));
  });

  test("Debe responder 500 cuando falla getConnection", async () => {
    // Arrange:
    // Se simula un fallo al abrir la conexión con la base de datos.
    const body = {
      id_usuario: 6,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "12345678",
    };

    // Act:
    const res = await request(app).post("/api/register").send(body);

    // Assert:
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Error al registrar usuario",
      detalles: "Fallo al obtener conexión",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  });
});