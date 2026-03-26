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

  test("debe responder 200 aunque ocurra un error al cerrar la conexión", async () => {
    /*
      Objetivo:
      Verificar que el error en close no modifique la respuesta exitosa.

      Mock utilizado:
      - oracledb.getConnection: devuelve conexión simulada.
      - connection.execute: devuelve filas simuladas.
      - connection.close: rechaza con error simulado.

      Qué se valida:
      - estado HTTP 200
      - cuerpo con la lista de plantas
      - ejecución de la consulta
      - intento de cierre de conexión
      - registro del error de cierre en consola

      Observación:
      El error de close ocurre después de haber construido la respuesta.
    */

    // Arrange
    const plantasMock = [
      { ID_PLANTA: 1, NOMBRE_COMUN: "Aloe Vera" },
    ];

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rows: plantasMock });
    connectionMock.close.mockRejectedValue(new Error("Error al cerrar"));

    // Act
    const response = await request(app).get("/api/plantas");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(plantasMock);

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al cerrar conexión en lista de plantas:",
      expect.any(Error)
    );
  });
});