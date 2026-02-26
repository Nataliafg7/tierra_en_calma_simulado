// HU1B_p2.test.js
// Prueba unitaria correspondiente al camino independiente P2
// Escenario: Error al conectar a Oracle

const request = require("supertest");
const app = require("../server");

// Se realiza mock del módulo oracledb para no depender de la base de datos real
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");

describe("HU1 - Registro de usuario - Error de conexión", () => {

  test("P2 - Debe retornar 500 cuando falla la conexión a Oracle", async () => {

    // 1️ Se simula un error en la conexión a Oracle
    // Se fuerza que getConnection lance una excepción
    const errorConexion = new Error("Fallo de conexión a Oracle");
    oracledb.getConnection.mockRejectedValue(errorConexion);

    // 2️ Envío una solicitud POST válida al endpoint
    // Los datos son correctos, pero la conexión fallará
    const response = await request(app)
      .post("/api/register")
      .send({
        nombre: "Juliana",
        correo: "julianacasas3@gmail.com",
        password: "123456"
      });

    // 3️ Se verifica que el sistema responda con error 500
    expect(response.status).toBe(500);

    // 4️ Se verifica que el mensaje de error sea el definido en el backend
    expect(response.body).toHaveProperty("error", "Error al registrar usuario");

    // 5️ Confirmo que efectivamente se intentó establecer la conexión
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);

  });

});