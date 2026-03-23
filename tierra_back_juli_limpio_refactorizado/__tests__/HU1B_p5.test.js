// HU1B_p5.test.js
// Prueba unitaria correspondiente al camino independiente P5
// Escenario: Camino estructural adicional (re-evaluación en N3 antes de ir a catch)

const request = require("supertest");
const app = require("../server");

// Mock del módulo oracledb
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");

describe("HU1 - Registro de usuario - Camino estructural adicional (P5)", () => {

  test("P5 - Debe cubrir re-evaluación estructural: una ejecución OK y luego una ejecución que cae en catch", async () => {

    // 1️ Se crea una conexión simulada con sus métodos
    const mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };

    // 2️ Se configura el mock para que siempre entregue conexión
    oracledb.getConnection.mockResolvedValue(mockConnection);

    // 3️  Primera ejecución: todo funciona (flujo exitoso)
    mockConnection.execute.mockResolvedValueOnce({ rowsAffected: 1 });
    mockConnection.close.mockResolvedValueOnce();

    const response1 = await request(app)
      .post("/api/register")
      .send({
        nombre: "Mario",
        correo: "mario@test.com",
        password: "123456"
      });

    expect(response1.status).toBe(200);
    expect(response1.body).toHaveProperty("message", "Usuario registrado con éxito");

    // 4️ Segunda ejecución: se fuerza un error para desviar el flujo al catch
    // En este caso, simulo que el INSERT falla en el segundo intento
    const errorInsert = new Error("Error en INSERT (segundo intento)");
    mockConnection.execute.mockRejectedValueOnce(errorInsert);

    const response2 = await request(app)
      .post("/api/register")
      .send({
        nombre: "Mario",
        correo: "mario2@test.com",
        password: "123456"
      });

    expect(response2.status).toBe(500);
    expect(response2.body).toHaveProperty("error", "Error al registrar usuario");

    // 5️ Verificaciones adicionales para confirmar que se recorrió la lógica
    expect(oracledb.getConnection).toHaveBeenCalledTimes(2);
    expect(mockConnection.execute).toHaveBeenCalledTimes(2);

  });

});