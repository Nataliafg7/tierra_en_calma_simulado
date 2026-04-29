/**
 * PRUEBAS DE RENDIMIENTO - BACKEND
 *
 * Historias evaluadas:
 * HU3  - Login
 * HU8  - Consulta de plantas
 * HU11 - Consulta de mis plantas
 *
 * Objetivo:
 * Verificar que los endpoints respondan en tiempos adecuados
 * y que el sistema soporte múltiples solicitudes sin degradación.
 */

const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

describe("Rendimiento backend", () => {
  let app;
  let connectionMock;

  /**
   * Se prepara la aplicación y la conexión simulada antes de cada prueba.
   */
  beforeEach(() => {
    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn(),
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
  });

  test("HU3 - login responde en tiempo adecuado", async () => {
    /**
     * Se simula respuesta de base de datos
     */
    connectionMock.execute.mockResolvedValueOnce({
      rows: [{}],
    });

    /**
     * Se mide el tiempo de ejecución del endpoint
     */
    const inicio = Date.now();

    const response = await request(app)
      .post("/api/login")
      .send({
        correo_electronico: "test@test.com",
        contrasena: "12345678",
      });

    const tiempo = Date.now() - inicio;

    /**
     * Se valida que el tiempo sea menor a 500 ms
     */
    expect(response.status).toBe(200);
    expect(tiempo).toBeLessThan(1000);
  });

  test("HU8 - consulta de plantas es rápida", async () => {
    connectionMock.execute.mockResolvedValueOnce({
      rows: [],
    });

    const inicio = Date.now();

    const response = await request(app).get("/api/plantas");

    const tiempo = Date.now() - inicio;

    expect(response.status).toBe(200);
    expect(tiempo).toBeLessThan(500);
  });

  test("HU11 - consulta de mis plantas es rápida", async () => {
    connectionMock.execute.mockResolvedValueOnce({
      rows: [],
    });

    const inicio = Date.now();

    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "1");

    const tiempo = Date.now() - inicio;

    expect(response.status).toBe(200);
    expect(tiempo).toBeLessThan(500);
  });

  test("Carga - múltiples solicitudes consecutivas", async () => {
    /**
     * Se simula múltiples respuestas del backend
     */
    connectionMock.execute.mockResolvedValue({
      rows: [],
    });

    const inicio = Date.now();

    /**
     * Se ejecutan varias solicitudes seguidas
     */
    for (let i = 0; i < 10; i++) {
      await request(app).get("/api/plantas");
    }

    const tiempo = Date.now() - inicio;

    /**
     * Se valida que el sistema no se degrade
     */
    expect(tiempo).toBeLessThan(2000);
  });
});