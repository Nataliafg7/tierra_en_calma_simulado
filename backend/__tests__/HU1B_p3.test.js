/**
 * ============================================================
 * Escenario P3: Error en INSERT
 * ============================================================
 *
 * Tipo de mock:
 * - Mock de módulo
 * - Mock de implementación:
 *   - conexión OK
 *   - execute falla
 */

const request = require("supertest");

jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const { createApp } = require("../app");
const app = createApp();

describe("HU1 - Error en INSERT", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P3 - Retorna 500 si falla INSERT", async () => {

    // Arrange
    const conn = {
      execute: jest.fn().mockRejectedValue(new Error("Error insert")),
      close: jest.fn()
    };

    oracledb.getConnection.mockResolvedValue(conn);

    const usuario = {
      id_usuario: 1,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3000000000",
      correo_electronico: "juliana@gmail.com",
      contrasena: "12345678",
    };

    // Act
    const res = await request(app)
      .post("/api/register")
      .send(usuario);

    // Assert
    expect(res.status).toBe(500);
    expect(conn.execute).toHaveBeenCalled();

    // No se cierra porque falla antes
    expect(conn.close).not.toHaveBeenCalled();
  });
});