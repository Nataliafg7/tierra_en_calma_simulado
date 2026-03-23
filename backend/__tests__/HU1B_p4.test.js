const request = require("supertest");

// Se reemplaza el módulo real de Oracle por un mock
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const app = require("../server");

describe("HU1 - Registro de usuario - Error en close()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P4 - Debe retornar 500 cuando falla el cierre de conexión", async () => {
    // =========================
    // Arrange
    // =========================

    // Se crea una conexión simulada
    const mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };

    // La conexión se obtiene correctamente
    oracledb.getConnection.mockResolvedValue(mockConnection);

    // El INSERT se ejecuta correctamente
    mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

    // El cierre de conexión falla
    const errorClose = new Error("Error al cerrar conexión");
    mockConnection.close.mockRejectedValue(errorClose);

    // Datos válidos del registro
    const nuevoUsuario = {
      id_usuario: 1,
      nombre: "Ana",
      apellido: "Casas",
      telefono: "3000000000",
      correo_electronico: "ana@test.com",
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

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });
});