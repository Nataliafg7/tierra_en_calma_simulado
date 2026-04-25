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

describe("HU8B P4 - GET /api/plantas", () => {
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

    // Spy para validar el error de cierre sin mostrarlo en consola durante la prueba
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore(); // FIRST: restaura console.error para no afectar otros tests
  });

  test("Debe responder 200 aunque ocurra un error al cerrar la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se simula una consulta exitosa y un fallo posterior al cerrar la conexión
    // FIRST: el flujo está controlado con mocks y no depende de Oracle real
    const plantasMock = [
      { ID_PLANTA: 1, NOMBRE_COMUN: "Aloe Vera" },
    ];

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rows: plantasMock });
    connectionMock.close.mockRejectedValue(new Error("Error al cerrar"));

    // ======================= ACT =======================
    // Se consulta el endpoint del banco de especies
    const response = await request(app).get("/api/plantas");

    // ===================== ASSERT ======================
    expect(response.status).toBe(200);
    // Fluent assertion: expresa claramente que el error de cierre no afecta la respuesta exitosa

    expect(response.body).toEqual(plantasMock);
    // Fluent assertion: valida el contrato exacto de respuesta con la lista de plantas

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se obtuvo conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta principal se ejecutó correctamente

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que el cierre se intentó aunque fallara

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al cerrar conexión en lista de plantas:",
      expect.any(Error)
    );
    // Fluent assertion: valida el manejo flexible del error de cierre sin depender de una instancia exacta

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});