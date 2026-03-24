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

describe("HU1 - Backend - P4: Registro exitoso", () => {
  let app;
  let executeMock;
  let closeMock;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();

    executeMock = jest.fn().mockResolvedValue({});
    closeMock = jest.fn().mockResolvedValue();

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock
    });
  });

  test("Debe registrar usuario correctamente", async () => {
    // Arrange:
    const body = {
      id_usuario: 4,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "12345678"
    };

    // Act:
    const res = await request(app).post("/api/register").send(body);

    // Assert:
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Usuario registrado con éxito"
    });

    expect(oracledb.getConnection).toHaveBeenCalled();
    expect(executeMock).toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
  });
});