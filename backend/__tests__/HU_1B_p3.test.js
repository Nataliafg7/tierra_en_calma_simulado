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

  test("Debe rechazar el registro cuando la contraseña tiene menos de 8 caracteres", async () => {
    // Arrange: Se construye un usuario con contraseña inválida (menor a 8 caracteres)
    const usuarioInvalido = {
      id_usuario: 3,
      nombre: "Juliana",
      apellido: "Florez",
      telefono: "123456",
      correo_electronico: "test@mail.com",
      contrasena: "1234"
    };

    // Act: Se envía la petición de registro al endpoint
    const response = await request(app)
      .post("/api/register")
      .send(usuarioInvalido);

    // Assert: Se valida que el sistema rechaza la solicitud correctamente
    expect(response.status).toBe(400); // Debe responder con error de validación

    expect(response.body).toEqual({
      error: "La contraseña debe tener al menos 8 caracteres"
    }); // Mensaje claro y específico

    // Assert adicional: No debe intentar conectarse a la BD si la validación falla
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});