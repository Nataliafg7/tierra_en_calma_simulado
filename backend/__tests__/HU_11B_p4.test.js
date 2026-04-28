const request = require("supertest");

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

const oracledb = require("oracledb");
const { createApp } = require("../app");

describe("HU11B P4 - GET /api/mis-plantas con error en getConnection", () => {
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

  test("Debe responder 500 cuando falla la apertura de conexión", async () => {
    // ===================== ARRANGE =====================
    // Se simula un fallo al intentar conectarse con Oracle
    // FIRST: no se usa Oracle real porque getConnection está controlado por mock
    oracledb.getConnection.mockRejectedValue(new Error("fallo al conectar"));

    // ======================= ACT =======================
    // Se ejecuta el endpoint para cubrir la ruta de error al abrir conexión
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "3");

    // ===================== ASSERT ======================
    expect(response.status).toBe(500);
    // Fluent assertion: valida que el endpoint responde con error interno del servidor

    expect(response.body).toMatchObject({
      error: "Error al obtener las plantas del usuario",
    });
    // Fluent assertion: valida el mensaje de error controlado

    expect(response.body).toHaveProperty("error");
    // Fluent assertion: confirma que la respuesta contiene la propiedad error

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó abrir conexión una sola vez

    expect(errorSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: valida que el error fue registrado en consola

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al obtener las plantas del usuario:",
      expect.any(Error)
    );
    // Fluent assertion: valida que se registró el mensaje de error esperado

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});