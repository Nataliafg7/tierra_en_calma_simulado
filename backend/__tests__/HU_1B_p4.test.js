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

  test("Debe registrar un usuario correctamente cuando los datos son válidos", async () => {
    // Arrange: Se prepara un usuario con todos los datos válidos para el registro
    const usuarioValido = {
      id_usuario: 4,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "12345678"
    };

    // Act: Se envía la solicitud al endpoint de registro
    const response = await request(app)
      .post("/api/register")
      .send(usuarioValido);

    // Assert: Se valida que el sistema responda con éxito
    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Usuario registrado con éxito"
    });

    // Assert: Se valida que el flujo de base de datos se haya ejecutado correctamente
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});