// Nueva

const request = require("supertest");

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
const app = require("../server");

describe("HDU21 / HDU25 - Endpoints /api/datos y /api/historial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P1 - /api/datos debe retornar el último dato", async () => {
    // Arrange
    mqttService.getUltimoDato.mockReturnValue("T:22.00,H:50.00%");

    // Act
    const response = await request(app).get("/api/datos");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      dato: "T:22.00,H:50.00%",
    });
  });

  test("P2 - /api/historial debe retornar el historial", async () => {
    // Arrange
    mqttService.getHistorial.mockReturnValue([
      "T:22.00,H:50.00%",
      "T:23.00,H:52.00%",
    ]);

    // Act
    const response = await request(app).get("/api/historial");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      historial: ["T:22.00,H:50.00%", "T:23.00,H:52.00%"],
    });
  });
});