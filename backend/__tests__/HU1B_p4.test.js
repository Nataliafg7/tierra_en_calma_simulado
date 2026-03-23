/**
 * ============================================================
 * Escenario P4: Error en close()
 * ============================================================
 *
 * Tipo de mock:
 * - Mock de módulo
 * - Mock de implementación:
 *   - execute OK
 *   - close falla
 */

const request = require("supertest");

jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const { createApp } = require("../app");
const app = createApp();

describe("HU1 - Error en close", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P4 - Retorna 500 si falla close", async () => {

    // Arrange
    const conn = {
      execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
      close: jest.fn().mockRejectedValue(new Error("Error close"))
    };

    oracledb.getConnection.mockResolvedValue(conn);

    const usuario = {
      id_usuario: 1,
      nombre: "Ana",
      apellido: "Casas",
      telefono: "3000000000",
      correo_electronico: "ana@gmail.com",
      contrasena: "12345678",
    };

    // Act
    const res = await request(app)
      .post("/api/register")
      .send(usuario);

    // Assert
    expect(res.status).toBe(500);
    expect(conn.execute).toHaveBeenCalled();
    expect(conn.close).toHaveBeenCalled();
  });
});