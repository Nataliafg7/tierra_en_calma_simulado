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

describe("HU10B - Asociación de plantas", () => {
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

  test("HU10B_P1 - debe responder 200 cuando la planta se registra correctamente", async () => {
    // FIRST: prueba rápida, independiente y repetible porque usa Oracle simulado.

    // ===================== ARRANGE =====================
    // Se prepara el cuerpo válido para asociar una planta a un usuario.
    const body = {
      id_usuario: 10,
      id_planta: 3,
    };

    // Se simula una conexión exitosa con Oracle y una inserción correcta.
    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({});
    connectionMock.close.mockResolvedValue();

    // ======================= ACT =======================
    // Se envía la solicitud POST al endpoint de asociación de plantas.
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // ===================== ASSERT ======================
    // Se valida que el endpoint responda exitosamente.
    expect(response.status)
      .toBe(200);

    // Se valida el mensaje devuelto por el backend.
    expect(response.body)
      .toEqual({
        message: "Planta registrada con éxito en tu jardín",
      });

    // Se valida que el backend solicite una conexión a Oracle.
    expect(oracledb.getConnection)
      .toHaveBeenCalledTimes(1);

    // Se valida que se ejecute una operación SQL.
    expect(connectionMock.execute)
      .toHaveBeenCalledTimes(1);

    // Se valida que la consulta inserte la relación usuario-planta con autocommit.
    expect(connectionMock.execute)
      .toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.PLANTAS_USUARIO"),
        { id_planta: 3, id_usuario: 10 },
        { autoCommit: true }
      );

    // Se valida que la conexión se cierre al finalizar el proceso.
    expect(connectionMock.close)
      .toHaveBeenCalledTimes(1);
  });
});