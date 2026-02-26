// HU1B_p3.test.js
// Prueba unitaria correspondiente al camino independiente P3
// Escenario: Error durante el INSERT

const request = require("supertest");
const app = require("../server");

// Mock del módulo oracledb
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");

describe("HU1 - Registro de usuario - Error en INSERT", () => {

  test("P3 - Debe retornar 500 cuando falla el INSERT", async () => {

    // 1️ Se simulo una conexión exitosa
    const mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };

    oracledb.getConnection.mockResolvedValue(mockConnection);

    // 2️ Se simula error en el método execute (INSERT)
    const errorInsert = new Error("Error en INSERT");
    mockConnection.execute.mockRejectedValue(errorInsert);

    // 3️  Se envía la solicitud POST válida
    const response = await request(app)
      .post("/api/register")
      .send({
        nombre: "juliana",
        correo: "juliana@gmail.com",
        password: "123456"
      });

    // 4️ Se verifica que el sistema responda con 500
    expect(response.status).toBe(500);

    // 5️ Se verifica que el mensaje de error sea el esperado
    expect(response.body).toHaveProperty("error", "Error al registrar usuario");

    // 6️ SSe Confirma que se intentó ejecutar el INSERT
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);

  });

});