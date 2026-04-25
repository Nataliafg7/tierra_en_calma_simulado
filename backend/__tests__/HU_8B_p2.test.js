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

describe("HU8B P2 - GET /api/plantas", () => {
  let app;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
    app = createApp();

    // Spy para validar el registro del error sin mostrarlo en consola durante la prueba
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore(); // FIRST: restaura console.error para no afectar otros tests
  });

  test("Debe responder 500 cuando ocurre un error al obtener la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se simula un fallo al abrir conexión con Oracle
    // FIRST: el error está controlado por el mock y no depende de una BD real
    oracledb.getConnection.mockRejectedValue(new Error("Fallo de conexión"));

    // ======================= ACT =======================
    // Se consulta el endpoint del banco de especies
    const response = await request(app).get("/api/plantas");

    // ===================== ASSERT ======================
    expect(response.status).toBe(500);
    // Fluent assertion: expresa claramente el código HTTP esperado ante un error interno

    expect(response.body).toEqual({
      error: "Error al obtener la lista de plantas",
    });
    // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó obtener conexión una sola vez

    expect(errorSpy).toHaveBeenCalled();
    // Fluent assertion: confirma que el error fue registrado de forma controlada

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});