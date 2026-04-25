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

describe("HU8B P5 - GET /api/plantas", () => {
  let app;
  let connectionMock;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn(),
    };

    // Spy para validar los errores registrados sin mostrarlos en consola durante la prueba
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore(); // FIRST: restaura console.error para no afectar otros tests
  });

  test("Debe responder 500 cuando falla la consulta y también falla el cierre de la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se simula que la consulta principal falla y luego también falla close
    // FIRST: ambos errores están controlados por mocks, sin depender de Oracle real
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockRejectedValue(new Error("Error en execute"));
    connectionMock.close.mockRejectedValue(new Error("Error en close"));

    // ======================= ACT =======================
    // Se consulta el endpoint del banco de especies
    const response = await request(app).get("/api/plantas");

    // ===================== ASSERT ======================
    expect(response.status).toBe(500);
    // Fluent assertion: expresa claramente que el error principal debe responder como error interno

    expect(response.body).toEqual({
      error: "Error al obtener la lista de plantas",
    });
    // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó ejecutar la consulta principal

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó cerrar la conexión aunque también fallara

    expect(errorSpy).toHaveBeenCalled();
    // Fluent assertion: valida que los errores fueron registrados de forma controlada

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});