const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

jest.mock("../mqttService", () => ({}));
jest.mock("../cuidadosService", () => ({ crearCuidado: jest.fn() }));
jest.mock("../pkgCentralService", () => ({ verificarCondiciones: jest.fn() }));
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));
jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));
jest.mock("yamljs", () => ({
  load: jest.fn(() => ({})),
}));

describe("HU10B P3 - POST /api/registrar-planta", () => {
  let app;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
    app = createApp();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test("Debe responder 500 cuando falla la obtención de la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se prepara una solicitud válida, pero se simula un fallo al obtener conexión con Oracle
    // FIRST: no se usa Oracle real porque getConnection se controla con mock
    const body = {
      id_usuario: 10,
      id_planta: 3,
    };

    oracledb.getConnection.mockRejectedValue(new Error("Fallo de conexión"));

    // ======================= ACT =======================
    // Se ejecuta el endpoint y se fuerza la ruta de error del servidor
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // ===================== ASSERT ======================
    expect(response.status).toBe(500);
    // Fluent assertion: valida que el endpoint responde con error interno del servidor

    expect(response.body).toMatchObject({
      error: "Error al registrar planta",
    });
    // Fluent assertion: valida el mensaje de error esperado para fallos en el registro

    expect(response.body).toHaveProperty("error");
    // Fluent assertion: confirma que la respuesta contiene la propiedad error

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó obtener conexión una sola vez

    expect(errorSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: valida que el error fue registrado en consola

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al registrar planta:",
      expect.any(Error)
    );
    // Fluent assertion: valida que se registró el mensaje de error esperado

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});