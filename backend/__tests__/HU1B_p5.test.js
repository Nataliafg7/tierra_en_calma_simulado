const request = require("supertest");

// Se reemplaza el módulo real de Oracle por un mock
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const app = require("../app");

describe("HU1 - Registro de usuario - Camino estructural adicional (P5)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P5 - Debe cubrir una ejecución exitosa y una segunda ejecución que cae en catch", async () => {
    // =========================
    // Arrange
    // =========================

    // Se crea una conexión simulada para reutilizarla en ambas ejecuciones
    const mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };

    // Siempre se obtiene conexión correctamente
    oracledb.getConnection.mockResolvedValue(mockConnection);

    // Primera ejecución: el INSERT funciona y la conexión se cierra bien
    mockConnection.execute.mockResolvedValueOnce({ rowsAffected: 1 });
    mockConnection.close.mockResolvedValueOnce(undefined);

    const usuario1 = {
      id_usuario: 1,
      nombre: "Mario",
      apellido: "Gomez",
      telefono: "3000000000",
      correo_electronico: "mario@test.com",
      contrasena: "12345678"
    };

    // =========================
    // Act - Primera ejecución
    // =========================

    const response1 = await request(app)
      .post("/api/register")
      .send(usuario1);

    // =========================
    // Assert - Primera ejecución
    // =========================

    expect(response1.status).toBe(200);
    expect(response1.body).toEqual({
      message: "Usuario registrado con éxito"
    });

    // Segunda ejecución: el INSERT falla
    const errorInsert = new Error("Error en INSERT (segundo intento)");
    mockConnection.execute.mockRejectedValueOnce(errorInsert);

    const usuario2 = {
      id_usuario: 2,
      nombre: "Mario",
      apellido: "Lopez",
      telefono: "3111111111",
      correo_electronico: "mario2@test.com",
      contrasena: "12345678"
    };

    // =========================
    // Act - Segunda ejecución
    // =========================

    const response2 = await request(app)
      .post("/api/register")
      .send(usuario2);

    // =========================
    // Assert - Segunda ejecución
    // =========================

    expect(response2.status).toBe(500);
    expect(response2.body).toHaveProperty(
      "error",
      "Error al registrar usuario"
    );

    // Se valida la cantidad de veces que se recorrió el flujo
    expect(oracledb.getConnection).toHaveBeenCalledTimes(2);
    expect(mockConnection.execute).toHaveBeenCalledTimes(2);

    // Solo la primera ejecución alcanzó a cerrar la conexión
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });
});