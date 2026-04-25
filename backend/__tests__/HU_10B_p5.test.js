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

describe("HU10B P5 - POST /api/registrar-planta", () => {
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

    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test("Debe responder 200 aunque falle el cierre de la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se prepara una solicitud válida y se simula que el registro funciona,
    // pero falla el cierre de la conexión
    // FIRST: no se usa Oracle real porque execute y close están controlados por mocks
    const body = {
      id_usuario: 10,
      id_planta: 3,
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({});
    connectionMock.close.mockRejectedValue(new Error("Error al cerrar"));

    // ======================= ACT =======================
    // Se ejecuta el endpoint para validar que el error en close no cambia la respuesta exitosa
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // ===================== ASSERT ======================
    expect(response.status).toBe(200);
    // Fluent assertion: valida que el endpoint conserva la respuesta exitosa

    expect(response.body).toMatchObject({
      message: "Planta registrada con éxito en tu jardín",
    });
    // Fluent assertion: valida el mensaje de éxito esperado

    expect(response.body).toHaveProperty("message");
    // Fluent assertion: confirma que la respuesta contiene la propiedad message

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
    // Fluent assertion: confirma que se intentó cerrar la conexión una sola vez

    expect(errorSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: valida que el error de cierre fue registrado en consola

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al cerrar conexión en registrar planta:",
      expect.any(Error)
    );
    // Fluent assertion: valida que se registró el mensaje de error esperado al cerrar conexión

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});