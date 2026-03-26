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

describe("HU1 - Backend - P5: Registro exitoso con error en close", () => {
  let app;
  let executeMock;
  let closeMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    executeMock = jest.fn().mockResolvedValue({});
    closeMock = jest.fn().mockRejectedValue(new Error("Error cerrando conexión"));

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Debe responder 200 aunque falle el cierre de la conexión", async () => {
    // Arrange:
    // Se simula un registro exitoso y luego un fallo al cerrar la conexión.
    const body = {
      id_usuario: 5,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "12345678",
    };

    // Act:
    const res = await request(app).post("/api/register").send(body);

    // Assert:
    // La respuesta exitosa ya se debió enviar antes del finally.
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Usuario registrado con éxito",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al cerrar la conexión en registro:",
      expect.any(Error)
    );
  });
});