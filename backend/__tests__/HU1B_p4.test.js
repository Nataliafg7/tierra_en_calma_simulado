// HU1B_p4.test.js
// Prueba unitaria correspondiente al camino independiente P4
// Escenario: Error al cerrar la conexión

const request = require("supertest");
const app = require("../server");

// Mock del módulo oracledb
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");

describe("HU1 - Registro de usuario - Error en close()", () => {

  test("P4 - Debe retornar 500 cuando falla el cierre de conexión", async () => {

    // 1️  Simulo una conexión exitosa
    const mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };

    oracledb.getConnection.mockResolvedValue(mockConnection);

    // 2️  Simulo ejecución exitosa del INSERT
    mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

    // 3️  Simulo error al cerrar la conexión
    const errorClose = new Error("Error al cerrar conexión");
    mockConnection.close.mockRejectedValue(errorClose);

    // 4️ Envío la solicitud POST válida
    const response = await request(app)
      .post("/api/register")
      .send({
        nombre: "Ana",
        correo: "ana@test.com",
        password: "123456"
      });

    // 5️ Se verifica que el sistema responda con 500
    expect(response.status).toBe(500);

    // 6 Se Verifica que el mensaje de error sea el esperado
    expect(response.body).toHaveProperty("error", "Error al registrar usuario");

    // 7️ Se confirma que se ejecutó el INSERT
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);

    // 8️ Se onfirma que se intentó cerrar la conexión
    expect(mockConnection.close).toHaveBeenCalledTimes(1);

  });

});