/**
 * ============================================================
 * Escenario P2: Error en conexión a Oracle
 * ============================================================
 *
 * Tipo de mock:
 * - Mock de módulo
 * - Mock de implementación (getConnection falla)
 */

const request = require("supertest");

jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const { createApp } = require("../app");
const app = createApp();

describe("HU1 - Error de conexión", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P2 - Retorna 500 si falla conexión", async () => {

    // Arrange
    oracledb.getConnection.mockRejectedValue(new Error("Error conexión"));

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
    expect(res.body).toHaveProperty("error");
  });
});