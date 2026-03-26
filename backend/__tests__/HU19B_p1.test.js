// Pruebas Unitarias Backend – HU19 Simulación de riego manual
// Escenario P1: Envío exitoso del comando (HTTP 200)

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
  let server;
  let baseUrl;

  beforeAll(() => {
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Escenario 1 (P1) Envío exitoso del comando de riego", async () => {
    // Arrange
    mqttService.enviarComandoRiego.mockResolvedValue({ ok: true });

    // Act
    const resp = await fetch(`${baseUrl}/api/regar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await resp.json();

    // Assert
    expect(mqttService.enviarComandoRiego).toHaveBeenCalledTimes(1);
    expect(resp.status).toBe(200);
    expect(body).toHaveProperty("message");
    expect(body.message).toBe("Comando de riego enviado");
  });
});