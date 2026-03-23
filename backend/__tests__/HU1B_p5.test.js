/**
 * ============================================================
 * Escenario P5: Ejecución doble (step mock)
 * ============================================================
 *
 * Tipo de mock:
 * - Mock de módulo
 * - Mock de implementación secuencial:
 *   - primera ejecución OK
 *   - segunda falla
 */

const request = require("supertest");

jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const { createApp } = require("../app");
const app = createApp();

describe("HU1 - Camino estructural adicional", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P5 - Una ejecución exitosa y otra con error", async () => {

    // Arrange
    const conn = {
      execute: jest.fn(),
      close: jest.fn()
    };

    oracledb.getConnection.mockResolvedValue(conn);

    conn.execute.mockResolvedValueOnce({ rowsAffected: 1 });
    conn.close.mockResolvedValueOnce();

    // Act 1
    const res1 = await request(app)
      .post("/api/register")
      .send({
        id_usuario: 1,
        nombre: "Mario",
        apellido: "Gomez",
        telefono: "300",
        correo_electronico: "mario@test.com",
        contrasena: "12345678"
      });

    // Assert 1
    expect(res1.status).toBe(200);

    // Segunda ejecución falla
    conn.execute.mockRejectedValueOnce(new Error("error"));

    // Act 2
    const res2 = await request(app)
      .post("/api/register")
      .send({
        id_usuario: 2,
        nombre: "Mario",
        apellido: "Lopez",
        telefono: "311",
        correo_electronico: "mario2@test.com",
        contrasena: "12345678"
      });

    // Assert 2
    expect(res2.status).toBe(500);

    expect(conn.execute).toHaveBeenCalledTimes(2);
    expect(conn.close).toHaveBeenCalledTimes(1);
  });
});c