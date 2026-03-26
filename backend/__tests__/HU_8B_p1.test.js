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
    jest.clearAllMocks();
    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn(),
    };
  });

  test("debe responder 200 y retornar la lista de plantas cuando la consulta se ejecuta correctamente", async () => {
    // Arrange
    const plantasMock = [
      { ID_PLANTA: 1, NOMBRE_COMUN: "Aloe Vera" },
      { ID_PLANTA: 2, NOMBRE_COMUN: "Lavanda" },
    ];

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rows: plantasMock });
    connectionMock.close.mockResolvedValue();

    // Act
    const response = await request(app).get("/api/plantas");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(plantasMock);

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT ID_PLANTA, NOMBRE_COMUN"),
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });
});