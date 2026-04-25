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

describe("HU1 - Backend - P7: Error en execute con close exitoso", () => {
  let app;
  let executeMock;
  let closeMock;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();

    executeMock = jest.fn().mockRejectedValue(new Error("Fallo en execute"));
    closeMock = jest.fn().mockResolvedValue();

    oracledb.getConnection.mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });
  });

  test("Debe responder 500 cuando falla execute y cerrar la conexión correctamente", async () => {
    // Arrange: Se prepara un usuario válido para que el error ocurra únicamente durante execute
    const usuarioValido = {
      id_usuario: 7,
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

    // Assert: Se valida que el sistema responda con error interno controlado
    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      error: "Error al registrar usuario",
      detalles: "Fallo en execute",
    }); // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    // Assert: Se valida que la conexión se obtuvo, se intentó ejecutar la operación y luego se cerró
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});