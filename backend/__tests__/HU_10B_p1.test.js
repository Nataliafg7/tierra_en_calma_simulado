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

describe("HU10B P1 - POST /api/registrar-planta", () => {
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

  test("Debe responder 200 cuando la planta se registra correctamente", async () => {
    // ===================== ARRANGE =====================
    // Se prepara una solicitud válida para asociar una planta a un usuario
    // FIRST: no se usa Oracle real porque la conexión y el INSERT están controlados por mocks
    const body = {
      id_usuario: 10,
      id_planta: 3,
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({});
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se ejecuta el endpoint encargado de registrar la planta en el jardín del usuario
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // ===================== ASSERT ======================
    expect(response.status).toBe(200);
    // Fluent assertion: expresa claramente que el registro exitoso debe devolver HTTP 200

    expect(response.body).toEqual({
      message: "Planta registrada con éxito en tu jardín",
    });
    // Fluent assertion: valida el contrato exacto de respuesta del endpoint

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que el INSERT se ejecutó una sola vez

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.PLANTAS_USUARIO"),
      { id_planta: 3, id_usuario: 10 },
      { autoCommit: true }
    );
    // Fluent assertion: valida SQL, parámetros y autoCommit usados para registrar la planta

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró correctamente

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});