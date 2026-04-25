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

describe("HU1 - Backend - P8: Error en execute y también en close", () => {
  let app;
  let executeMock;
  let closeMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    executeMock = jest.fn().mockRejectedValue(new Error("Fallo en execute"));
    closeMock = jest.fn().mockRejectedValue(new Error("Fallo al cerrar conexión"));

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });

    // Se intercepta console.error para validar el manejo del error sin afectar la salida del test
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("Debe responder 500 cuando falla execute y también falla el cierre de la conexión", async () => {
    // Arrange: Se prepara un usuario válido para que el fallo ocurra durante execute y luego en close
    const usuarioValido = {
      id_usuario: 8,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "12345678",
    };

    // Act: Se envía la solicitud de registro al endpoint
    const response = await request(app)
      .post("/api/register")
      .send(usuarioValido);

    // Assert: Se valida que el endpoint conserve el error principal de execute
    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      error: "Error al registrar usuario",
      detalles: "Fallo en execute",
    }); // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    // Assert: Se valida que el flujo de conexión se haya ejecutado una sola vez
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);

    // Assert: Se valida que el error del cierre fue manejado sin reemplazar el error principal
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al cerrar la conexión en registro:",
      expect.any(Error)
    ); // Fluent assertion: valida el manejo flexible del error sin depender de una instancia exacta
  });
});