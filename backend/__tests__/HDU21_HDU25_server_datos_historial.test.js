// Nueva

const request = require("supertest");
const { expect: expectFluent } = require("chai");

jest.mock("../mqttService", () => ({
  initMQTTBroker: jest.fn(),
  initMQTTSimulator: jest.fn(),
  getUltimoDato: jest.fn(),
  getHistorial: jest.fn(),
  enviarComandoRiego: jest.fn(),
  setSensorForPlanta: jest.fn(),
}));

jest.mock("../cuidadosService", () => ({
  crearCuidado: jest.fn(),
}));

jest.mock("../pkgCentralService", () => ({
  verificarCondiciones: jest.fn(),
}));

const mqttService = require("../mqttService");
const { createApp } = require("../app");

describe("HDU21 / HDU25 - Endpoints /api/datos y /api/historial", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("P1 - /api/datos debe retornar el último dato", async () => {
    // Arrange
    const dato = "T:22.00,H:50.00%";
    mqttService.getUltimoDato.mockReturnValue(dato);

    // Act
    const response = await request(app).get("/api/datos");

    // Assert
    expectFluent(response.status).to.equal(200);

    expectFluent(response.body).to.deep.equal({
      dato: dato,
    });
  });

  test("P2 - /api/historial debe retornar el historial", async () => {
    // Arrange
    const historial = [
      "T:22.00,H:50.00%",
      "T:23.00,H:52.00%",
    ];
    mqttService.getHistorial.mockReturnValue(historial);

    // Act
    const response = await request(app).get("/api/historial");

    // Assert
    expectFluent(response.status).to.equal(200);

    expectFluent(response.body).to.deep.equal({
      historial: historial,
    });
  });
});