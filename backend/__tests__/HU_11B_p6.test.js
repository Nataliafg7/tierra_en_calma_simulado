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

describe("HU11B P6 - GET /api/mis-plantas con error al cerrar conexión", () => {
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

  test("Debe responder 200 aunque falle el close, dejando trazabilidad del error", async () => {
    // ===================== ARRANGE =====================
    // La consulta sale bien, pero el cierre de conexión falla dentro del finally
    // FIRST: no se usa Oracle real porque execute y close están controlados por mocks
    const filas = [
      {
        ID_PLANTA_USUARIO: 20,
        ID_PLANTA: 4,
        NOMBRE_COMUN: "Lengua de suegra",
        NOMBRE_CIENTIFICO: "Sansevieria trifasciata",
      },
    ];

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rows: filas });
    connectionMock.close.mockRejectedValue(new Error("fallo al cerrar"));

    // ======================= ACT =======================
    // Se ejecuta el endpoint para validar que el error en close no cambia la respuesta exitosa
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "9");

    // ===================== ASSERT ======================
    expect(response.status).toBe(200);
    // Fluent assertion: valida que la respuesta principal sigue siendo exitosa

    expect(response.body).toEqual(filas);
    // Fluent assertion: valida que se devuelven las plantas consultadas correctamente

    expect(response.body).toHaveSize(1);
    // Fluent assertion: confirma la cantidad de plantas devueltas en la respuesta

    expect(response.body[0]).toMatchObject({
      ID_PLANTA_USUARIO: 20,
      ID_PLANTA: 4,
      NOMBRE_COMUN: "Lengua de suegra",
      NOMBRE_CIENTIFICO: "Sansevieria trifasciata",
    });
    // Fluent assertion: valida la estructura y datos de la planta devuelta

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se abrió conexión una sola vez

    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la consulta se ejecutó una sola vez

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("FROM TIERRA_EN_CALMA.PLANTAS_USUARIO pu"),
      { id_usuario: 9 },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    // Fluent assertion: valida SQL, parámetro del usuario y formato de salida

    expect(connectionMock.close).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que se intentó cerrar la conexión una sola vez

    expect(errorSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: valida que el error de cierre fue registrado en consola

    expect(errorSpy).toHaveBeenCalledWith(
      "Error al cerrar conexión en mis plantas:",
      expect.any(Error)
    );
    // Fluent assertion: valida el mensaje exacto usado para registrar el error de cierre

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});