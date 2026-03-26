// Pruebas Unitarias Backend – HU19 Simulación de riego manual
// Escenario P2: Fallo en el envío del comando (HTTP 500)

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

  test("Escenario 2 (P2) – Fallo en el envío del comando de riego", async () => {
    // Arrange
    mqttService.enviarComandoRiego.mockResolvedValue({ ok: false });

    // Act
    const resp = await fetch(`${baseUrl}/api/regar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await resp.json().catch(() => ({}));

    // Assert
    expect(mqttService.enviarComandoRiego).toHaveBeenCalledTimes(1);
    expect(resp.status).toBe(500);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("No se pudo enviar el comando");
  });
});