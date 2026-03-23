const request = require("supertest");

// Se reemplaza Oracle por un mock
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");

// IMPORTANTE: se usa app.js porque ahí está la lógica del endpoint
const app = require("../app");

describe("HU1 - Registro de usuario - Error en INSERT", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P3 - Debe retornar 500 cuando falla el INSERT", async () => {

    // =========================
    // Arrange
    // =========================

    // Conexión simulada
    const mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };

    // La conexión sí funciona
    oracledb.getConnection.mockResolvedValue(mockConnection);

    // Pero el INSERT falla
    const errorInsert = new Error("Error en INSERT");
    mockConnection.execute.mockRejectedValue(errorInsert);

    // Datos válidos del endpoint real
    const nuevoUsuario = {
      id_usuario: 1,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3000000000",
      correo_electronico: "juliana.casas@gmail.com",
      contrasena: "12345678"
    };

    // =========================
    // Act
    // =========================

    const response = await request(app)
      .post("/api/register")
      .send(nuevoUsuario);

    // =========================
    // Assert
    // =========================

    expect(response.status).toBe(500);

    expect(response.body).toHaveProperty(
      "error",
      "Error al registrar usuario"
    );

    // Se intentó conectar
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);

    // Se intentó ejecutar el INSERT
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);

    // IMPORTANTE: no debe cerrarse porque falló antes
    expect(mockConnection.close).not.toHaveBeenCalled();
  });

});