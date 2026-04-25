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

describe("HU11B P3 - GET /api/mis-plantas exitoso con rows nulo", () => {
  let app;
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn(),
    };
  });

  test("Debe responder 200 con arreglo vacío cuando result.rows es null", async () => {
    // ===================== ARRANGE =====================
    // Se fuerza el caso donde Oracle responde sin filas explícitas
    // FIRST: no se usa Oracle real porque execute está controlado por mock
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rows: null });
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se ejecuta el endpoint para validar que rows null se normaliza como arreglo vacío
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "8");

    // ===================== ASSERT ======================
    expect(response.status).toBe(200);
    // Fluent assertion: valida que el endpoint responde exitosamente aunque rows sea null

    expect(response.body).toEqual([]);
    // Fluent assertion: valida que rows null se convierte en arreglo vacío

    expect(response.body).toHaveSize(0);
    // Fluent assertion: confirma que no se devuelven plantas

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta se ejecutó una sola vez

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("FROM TIERRA_EN_CALMA.PLANTAS_USUARIO pu"),
      { id_usuario: 8 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Fluent assertion: valida SQL, parámetro del usuario y formato de salida

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró correctamente

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});