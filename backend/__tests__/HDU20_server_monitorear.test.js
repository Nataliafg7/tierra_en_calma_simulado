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

describe("HDU20 - Endpoint /api/monitorear", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P1 - Debe responder 400 cuando id_planta_usuario es inválido", async () => {
    // Arrange
    const payload = { id_planta_usuario: "abc" };

    // Act
    const response = await request(app).post("/api/monitorear").send(payload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      ok: false,
      error: "id_planta_usuario inválido",
    });
    expect(mqttService.setSensorForPlanta).not.toHaveBeenCalled();
  });

  test("P2 - Debe responder 200 cuando el monitoreo se prepara correctamente", async () => {
    // Arrange
    const payload = { id_planta_usuario: 17 };
    mqttService.setSensorForPlanta.mockResolvedValue(501);

    // Act
    const response = await request(app).post("/api/monitorear").send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      id_sensor: 501,
    });
    expect(mqttService.setSensorForPlanta).toHaveBeenCalledTimes(1);
    expect(mqttService.setSensorForPlanta).toHaveBeenCalledWith(17);
  });

  test("P3 - Debe responder 500 cuando ocurre un error al preparar el monitoreo", async () => {
    // Arrange
    const payload = { id_planta_usuario: 17 };
    mqttService.setSensorForPlanta.mockRejectedValue(new Error("Fallo interno"));

    // Act
    const response = await request(app).post("/api/monitorear").send(payload);

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: "No se pudo preparar el monitoreo",
    });
    expect(mqttService.setSensorForPlanta).toHaveBeenCalledTimes(1);
    expect(mqttService.setSensorForPlanta).toHaveBeenCalledWith(17);
  });
});