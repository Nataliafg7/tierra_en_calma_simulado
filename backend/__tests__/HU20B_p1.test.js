// __tests__/HU20B_p1.test.js
// HU20 - Registro automático del evento de riego en el historial
// Escenario P1: fallo en el envío del comando → HTTP 500

process.env.NODE_ENV = "test";

jest.mock("../mqttService", () => ({
  initMQTTBroker: jest.fn(),
  initMQTTSimulator: jest.fn(),
  getUltimoDato: jest.fn(),
  getHistorial: jest.fn(),
  enviarComandoRiego: jest.fn(),
  enviarComandoFisicoRiego: jest.fn(),
  ensureSensorForPlanta: jest.fn(),
  setSensorForPlanta: jest.fn(),
  stopSimulator: jest.fn()
}));

const mqttService = require("../mqttService");
const request = require("supertest");
const app = require("../server");

describe("HU20 Backend – POST /api/regar", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Escenario P1 – Retorna 500 cuando enviarComandoRiego falla", async () => {
    // Arrange
    mqttService.enviarComandoRiego.mockResolvedValue({ ok: false });

    // Act
    const res = await request(app).post("/api/regar").send({});

    // Assert
    expect(mqttService.enviarComandoRiego).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toBe("No se pudo enviar el comando");
  });
});