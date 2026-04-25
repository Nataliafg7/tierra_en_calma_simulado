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

describe("HU8B P3 - GET /api/plantas", () => {
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

    // Spy para validar el registro del error sin mostrarlo en consola durante la prueba
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore(); // FIRST: restaura console.error para no afectar otros tests
  });

  test("Debe responder 500 cuando falla la consulta y luego cerrar la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se simula una conexión exitosa, pero una falla durante execute
    // FIRST: el error está controlado por mocks y no depende de Oracle real
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockRejectedValue(new Error("Error en execute"));
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se consulta el endpoint del banco de especies
    const response = await request(app).get("/api/plantas");

    // ===================== ASSERT ======================
    expect(response.status).toBe(500);
    // Fluent assertion: expresa claramente el código HTTP esperado cuando falla la consulta

    expect(response.body).toEqual({
      error: "Error al obtener la lista de plantas",
    });
    // Fluent assertion: valida el contrato exacto de error devuelto por el endpoint

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se obtuvo una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta fue intentada una sola vez

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró aunque execute fallara

    expect(errorSpy).toHaveBeenCalled();
    // Fluent assertion: valida que el error fue registrado de forma controlada

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});