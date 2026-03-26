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

describe("HU8B P5 - GET /api/plantas", () => {
  let app;
  let connectionMock;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
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

  test("debe responder 500 cuando falla la consulta y además falla el cierre de la conexión", async () => {
    /*
      Objetivo:
      Verificar el escenario más completo de error:
      falla la consulta principal y luego también falla close.

      Mock utilizado:
      - oracledb.getConnection: devuelve conexión simulada.
      - connection.execute: rechaza con error simulado.
      - connection.close: rechaza con error simulado.

      Qué se valida:
      - estado HTTP 500
      - cuerpo del error principal
      - intento de ejecutar consulta
      - intento de cerrar conexión
      - registro de errores en consola

      Observación:
      El error principal sigue siendo el de la consulta.
      El error de close se registra, pero no reemplaza la respuesta enviada.
    */

    // Arrange
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockRejectedValue(new Error("Error en execute"));
    connectionMock.close.mockRejectedValue(new Error("Error en close"));

    // Act
    const response = await request(app).get("/api/plantas");

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error al obtener la lista de plantas",
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});