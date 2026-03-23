/**
 * ============================================================
 * PRUEBA UNITARIA – HU1 REGISTRO DE USUARIO
 * Escenario P3: Error durante el INSERT
 * ============================================================
 *
 * Objetivo:
 * Verificar que cuando la conexión a Oracle es exitosa,
 * pero falla la ejecución del INSERT, el sistema responde
 * con HTTP 500 y un mensaje de error controlado.
 *
 * Tipo de prueba:
 * Prueba unitaria (sin conexión real a base de datos).
 *
 * Tipo de mock utilizado:
 * - Mock de módulo: oracledb
 * - Mock de implementación:
 *   - getConnection → devuelve conexión simulada
 *   - execute → lanza error (mockRejectedValue)
 * - jest.fn(): para controlar llamadas y comportamiento
 */

const request = require("supertest");

// Se reemplaza completamente el módulo oracledb
// para evitar conexión real a la base de datos
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");

// Se usa createApp porque app.js exporta la función creadora
const { createApp } = require("../app");
const app = createApp();

describe("HU1 - Registro de usuario - Error en INSERT", () => {

  // Se limpian los mocks antes de cada prueba
  // para evitar que una ejecución afecte a otra
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P3 - Debe retornar 500 cuando falla el INSERT", async () => {

    // =========================
    // Arrange (preparación)
    // =========================

    /**
     * Se crea una conexión simulada.
     * Contiene los métodos que usa el endpoint:
     * - execute: ejecuta el INSERT
     * - close: cierra la conexión
     */
    const mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };

    /**
     * Mock de implementación:
     * getConnection devuelve la conexión simulada.
     */
    oracledb.getConnection.mockResolvedValue(mockConnection);

    /**
     * Mock de implementación:
     * Se simula un error en el INSERT.
     * Esto obliga al flujo a ir al bloque catch.
     */
    const errorInsert = new Error("Error en INSERT");
    mockConnection.execute.mockRejectedValue(errorInsert);

    /**
     * Datos válidos del registro.
     * Se usan datos correctos para asegurar que el error
     * proviene del INSERT y no del request.
     */
    const nuevoUsuario = {
      id_usuario: 1,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3000000000",
      correo_electronico: "juliana.casas@gmail.com",
      contrasena: "12345678"
    };

    // =========================
    // Act (ejecución)
    // =========================

    const response = await request(app)
      .post("/api/register")
      .send(nuevoUsuario);

    // =========================
    // Assert (verificación)
    // =========================

    /**
     * Se verifica que el sistema responda con error 500
     */
    expect(response.status).toBe(500);

    /**
     * Se verifica que el mensaje de error sea el esperado
     */
    expect(response.body).toHaveProperty(
      "error",
      "Error al registrar usuario"
    );

    /**
     * Se verifica que sí se intentó obtener conexión
     */
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);

    /**
     * Se verifica que sí se intentó ejecutar el INSERT
     */
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);

    /**
     * IMPORTANTE:
     * Como el INSERT falla, el flujo no alcanza a ejecutar close()
     */
    expect(mockConnection.close).not.toHaveBeenCalled();
  });

});