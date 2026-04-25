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

describe("HU10B P4 - POST /api/registrar-planta", () => {
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

  test("Debe responder 500 cuando falla el INSERT y luego cerrar la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se prepara una solicitud válida, pero se simula un error al ejecutar el INSERT
    // FIRST: no se usa Oracle real porque la conexión y el execute están controlados por mocks
    const body = {
      id_usuario: 10,
      id_planta: 3,
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockRejectedValue(new Error("Error en execute"));
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se ejecuta el endpoint para cubrir la ruta donde falla el INSERT
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // ===================== ASSERT ======================
    expect(response.status).toBe(500);
    // Fluent assertion: valida que el endpoint responde con error interno del servidor

    expect(response.body).toMatchObject({
      error: "Error al registrar planta",
    });
    // Fluent assertion: valida el mensaje controlado cuando falla el registro

    expect(response.body).toHaveProperty("error");
    // Fluent assertion: confirma que la respuesta contiene la propiedad error

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó ejecutar el INSERT una sola vez

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.PLANTAS_USUARIO"),
      { id_planta: 3, id_usuario: 10 },
      { autoCommit: true }
    );
    // Fluent assertion: valida que el INSERT se intentó con SQL, parámetros y autoCommit correctos

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró desde el bloque finally

    expect(errorSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: valida que el error fue registrado en consola

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al registrar planta:",
      expect.any(Error)
    );
    // Fluent assertion: valida que se registró el mensaje de error esperado

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});