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

describe("HDU19 - Endpoint /api/regar extra", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P1 - Debe responder 200 cuando el riego se envía correctamente", async () => {
    // Arrange
    mqttService.enviarComandoRiego.mockResolvedValue({ ok: true });

    // Act
    const response = await request(app).post("/api/regar").send({});

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Comando de riego enviado" });
  });

  test("P2 - Debe responder 500 cuando el riego no se puede enviar", async () => {
    // Arrange
    mqttService.enviarComandoRiego.mockResolvedValue({ ok: false });

    // Act
    const response = await request(app).post("/api/regar").send({});

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "No se pudo enviar el comando" });
  });
});