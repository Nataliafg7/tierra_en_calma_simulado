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

describe("HU8B P1 - GET /api/plantas", () => {
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

  test("Debe responder 200 y retornar la lista de plantas cuando la consulta es exitosa", async () => {
    // ===================== ARRANGE =====================
    // Se prepara una respuesta simulada de Oracle con plantas disponibles
    // FIRST: no se usa BD real, el resultado depende solo del mock configurado
    const plantasMock = [
      { ID_PLANTA: 1, NOMBRE_COMUN: "Aloe Vera" },
      { ID_PLANTA: 2, NOMBRE_COMUN: "Lavanda" },
    ];

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rows: plantasMock });
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se consulta el endpoint del banco de especies
    const response = await request(app).get("/api/plantas");

    // ===================== ASSERT ======================
    expect(response.status).toBe(200);
    // Fluent assertion: expresa claramente que la consulta exitosa debe responder HTTP 200

    expect(response.body).toEqual(plantasMock);
    // Fluent assertion: valida el contrato exacto de respuesta con la lista de plantas

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió una conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta SQL se ejecutó una sola vez

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT ID_PLANTA, NOMBRE_COMUN"),
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Fluent assertion: valida que se consulte específicamente el ID y nombre común de las plantas

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró correctamente

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});