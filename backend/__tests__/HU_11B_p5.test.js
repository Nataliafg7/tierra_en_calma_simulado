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

describe("HU11B P5 - GET /api/mis-plantas con error en execute", () => {
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

  test("Debe responder 500 cuando falla la consulta y aun así cerrar la conexión", async () => {
    // ===================== ARRANGE =====================
    // Se simula una conexión exitosa, pero con error durante el execute
    // FIRST: no se usa Oracle real porque execute y close están controlados por mocks
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockRejectedValue(new Error("fallo en execute"));
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se ejecuta el endpoint para cubrir la ruta donde falla la consulta
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "6");

    // ===================== ASSERT ======================
    expect(response.status).toBe(500);
    // Fluent assertion: valida que el endpoint responde con error interno del servidor

    expect(response.body).toMatchObject({
      error: "Error al obtener las plantas del usuario",
    });
    // Fluent assertion: valida el mensaje de error controlado

    expect(response.body).toHaveProperty("error");
    // Fluent assertion: confirma que la respuesta contiene la propiedad error

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó ejecutar la consulta una sola vez

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("FROM TIERRA_EN_CALMA.PLANTAS_USUARIO pu"),
      { id_usuario: 6 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Fluent assertion: valida SQL, parámetro del usuario y formato de salida

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la conexión se cerró desde el bloque finally

    expect(errorSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: valida que el error fue registrado en consola

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al obtener plantas del usuario:",
      expect.any(Error)
    );
    // Fluent assertion: valida que se registró el mensaje de error esperado

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});