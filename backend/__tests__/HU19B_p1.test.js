// Pruebas Unitarias Backend – HU19 Simulación de riego manual
// Escenario P1: Envío exitoso del comando (HTTP 200)

const request = require("supertest");
const { expect: expectFluent } = require("chai");

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
const app = require("../server");

describe("Pruebas Unitarias Backend – HU19 (POST /api/regar)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Escenario 1 (P1) Envío exitoso del comando de riego", async () => {
    // Arrange
    mqttService.enviarComandoRiego.mockResolvedValue({ ok: true });
    mqttService.enviarComandoFisicoRiego.mockResolvedValue({ ok: true });

    // Act
    const res = await request(app)
      .post("/api/regar")
      .send({});

    console.log("STATUS:", res.status);
    console.log("BODY:", res.body);
    console.log("TEXT:", res.text);
    console.log("CALL enviarComandoRiego:", mqttService.enviarComandoRiego.mock.calls.length);
    console.log("CALL enviarComandoFisicoRiego:", mqttService.enviarComandoFisicoRiego.mock.calls.length);

    // Assert temporal
    expectFluent(res.status).to.equal(200);
  });
});