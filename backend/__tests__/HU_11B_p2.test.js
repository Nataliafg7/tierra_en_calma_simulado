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

describe("HU11B P2 - GET /api/mis-plantas exitoso con filas", () => {
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

  test("Debe responder 200 con las plantas del usuario y cerrar la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se simula una consulta exitosa devolviendo plantas asociadas al usuario
    // FIRST: no se usa Oracle real porque la conexión y la consulta están controladas por mocks
    const filas = [
      {
        ID_PLANTA_USUARIO: 10,
        ID_PLANTA: 1,
        NOMBRE_COMUN: "Monstera",
        NOMBRE_CIENTIFICO: "Monstera deliciosa",
      },
      {
        ID_PLANTA_USUARIO: 11,
        ID_PLANTA: 2,
        NOMBRE_COMUN: "Potus",
        NOMBRE_CIENTIFICO: "Epipremnum aureum",
      },
    ];

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rows: filas });
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se ejecuta el endpoint para consultar las plantas registradas del usuario
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "5");

    // ===================== ASSERT ======================
    expect(response.status).toBe(200);
    // Fluent assertion: valida que la consulta exitosa responde con HTTP 200

    expect(response.body).toEqual(filas);
    // Fluent assertion: valida que se devuelven exactamente las plantas asociadas al usuario

    expect(response.body).toHaveSize(2);
    // Fluent assertion: confirma la cantidad de plantas devueltas en la respuesta

    expect(response.body[0]).toMatchObject({
      ID_PLANTA_USUARIO: 10,
      ID_PLANTA: 1,
      NOMBRE_COMUN: "Monstera",
      NOMBRE_CIENTIFICO: "Monstera deliciosa",
    });
    // Fluent assertion: valida la estructura y datos de la primera planta

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta se ejecutó una sola vez

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("FROM TIERRA_EN_CALMA.PLANTAS_USUARIO pu"),
      { id_usuario: 5 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Fluent assertion: valida SQL, parámetros y formato de salida usados en la consulta

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró correctamente

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});