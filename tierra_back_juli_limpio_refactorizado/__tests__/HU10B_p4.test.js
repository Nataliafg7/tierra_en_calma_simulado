jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const request = require("supertest");
const oracledb = require("oracledb");
const app = require("../app");

describe("HU10B_P4 - Registrar planta (falla al cerrar conexión)", () => {

  beforeEach(() => {
    // Limpia los mocks antes de cada prueba para evitar interferencias
    jest.clearAllMocks();
  });

  test("Debe responder 500 cuando la inserción es exitosa pero falla el cierre de la conexión", async () => {

    // ===================== ARRANGE =====================
    // Se crea una conexión simulada:
    // - execute() simula que el INSERT fue exitoso
    // - close() simula error al cerrar la conexión
    const connectionMock = {
      execute: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockRejectedValue(new Error("Error al cerrar conexión"))
    };

    // Se configura el mock para que getConnection retorne la conexión simulada
    oracledb.getConnection.mockResolvedValue(connectionMock);

    // Datos de entrada de la petición
    const body = {
      id_usuario: 1,
      id_planta: 2
    };

    // ===================== ACT =====================
    // Se ejecuta la petición al endpoint que registra la planta
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // ===================== ASSERT =====================
    // Se verifica que se intentó obtener una conexión
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);

    // Se verifica que se ejecutó la inserción
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);

    // Se verifica que se intentó cerrar la conexión
    expect(connectionMock.close).toHaveBeenCalledTimes(1);

    // Se verifica la respuesta esperada ante el error
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error al registrar planta"
    });
  });

});