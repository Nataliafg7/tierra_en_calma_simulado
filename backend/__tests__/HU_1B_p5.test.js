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

    // Se intercepta console.error para validar el manejo del error sin contaminar la salida del test
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Debe responder 200 aunque falle el cierre de la conexión", async () => {
    // Arrange: Usuario válido para simular flujo exitoso de registro
    const usuarioValido = {
      id_usuario: 5,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "12345678",
    };

    // Act: Se ejecuta el registro
    const response = await request(app)
      .post("/api/register")
      .send(usuarioValido);

    // Assert: Se valida que la respuesta principal NO se vea afectada por el error en el cierre
    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Usuario registrado con éxito",
    }); // Fluent assertion: valida exactamente el contrato de salida esperado

    // Assert: Se verifica que el flujo de base de datos se ejecutó completamente
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);

    // Assert: Se valida que el error fue manejado correctamente sin romper la ejecución
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al cerrar la conexión en registro:",
      expect.any(Error)
    ); // Fluent assertion: asegura que se registra el error esperado sin depender del mensaje exacto
  });
});