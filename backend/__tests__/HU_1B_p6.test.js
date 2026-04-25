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

    oracledb.getConnection.mockRejectedValue(
      new Error("Fallo al obtener conexión")
    );
  });

  test("Debe responder 500 cuando falla la conexión con la base de datos", async () => {
    // Arrange: Se prepara un usuario válido para que el fallo ocurra únicamente al obtener la conexión
    const usuarioValido = {
      id_usuario: 6,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "12345678",
    };

    // Act: Se envía la solicitud al endpoint de registro
    const response = await request(app)
      .post("/api/register")
      .send(usuarioValido);

    // Assert: Se valida que el sistema responda con error interno del servidor
    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      error: "Error al registrar usuario",
      detalles: "Fallo al obtener conexión",
    }); // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    // Assert: Se verifica que solo se intentó abrir la conexión una vez
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  });
});