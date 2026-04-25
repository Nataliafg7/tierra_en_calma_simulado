// __tests__/HU20B_p1.test.js
// HU20 - Registro automático del evento de riego en el historial
// Escenario P1: fallo en el envío del comando → HTTP 500

process.env.NODE_ENV = "test";

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
const { createApp } = require("../app");

describe("HU20 Backend – POST /api/regar", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("Escenario P1 – Retorna 500 cuando enviarComandoRiego falla", async () => {
    // Arrange
    mqttService.enviarComandoRiego.mockResolvedValue({ ok: false });

    // Act
    const res = await request(app)
      .post("/api/regar")
      .send({});

    // Assert
    expect(mqttService.enviarComandoRiego).toHaveBeenCalledTimes(1);

    expectFluent(res.status).to.equal(500);

    expectFluent(res.body)
      .to.be.an("object")
      .and.to.have.property("error")
      .that.equals("No se pudo enviar el comando");
  });
});