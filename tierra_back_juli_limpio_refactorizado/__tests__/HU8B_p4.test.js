jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: "OUT_FORMAT_OBJECT"
}));

const request = require("supertest");
const oracledb = require("oracledb");
const app = require("../app");

describe("HU8B_P4 - Lista de plantas (falla al cerrar conexión)", () => {

  beforeEach(() => {
    // Limpia los mocks antes de cada prueba para evitar interferencias
    jest.clearAllMocks();
  });

  test("Debe responder 500 cuando la consulta es exitosa pero falla el cierre de la conexión", async () => {

    // ===================== ARRANGE =====================
    // Se crea una conexión simulada:
    // - execute() simula consulta exitosa
    // - close() simula error al cerrar la conexión
    const connectionMock = {
      execute: jest.fn().mockResolvedValue({
        rows: [
          { ID_PLANTA: 1, NOMBRE_COMUN: "Lavanda" },
          { ID_PLANTA: 2, NOMBRE_COMUN: "Romero" }
        ]
      }),
      close: jest.fn().mockRejectedValue(new Error("Error al cerrar conexión"))
    };

    // Se configura el mock para que getConnection retorne la conexión simulada
    oracledb.getConnection.mockResolvedValue(connectionMock);

    // ===================== ACT =====================
    // Se ejecuta la petición al endpoint que lista las plantas
    const response = await request(app).get("/api/plantas");

    // ===================== ASSERT =====================
    // Se verifica que se intentó obtener una conexión
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);

    // Se verifica que se ejecutó la consulta
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);

    // Se verifica que se intentó cerrar la conexión
    expect(connectionMock.close).toHaveBeenCalledTimes(1);

    // Se verifica la respuesta esperada ante el error
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error al obtener la lista de plantas"
    });
  });

});