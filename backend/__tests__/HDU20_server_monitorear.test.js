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

describe("HDU20 - Endpoint /api/monitorear", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("P1 - Debe responder 400 cuando id_planta_usuario es inválido", async () => {
    const payload = { id_planta_usuario: "abc" };

    const response = await request(app)
      .post("/api/monitorear")
      .send(payload);

    expectFluent(response.status).to.equal(400);

    expectFluent(response.body).to.deep.equal({
      ok: false,
      error: "id_planta_usuario inválido",
    });

    expect(mqttService.setSensorForPlanta).not.toHaveBeenCalled();
  });

  test("P2 - Debe responder 200 cuando el monitoreo se prepara correctamente", async () => {
    const payload = { id_planta_usuario: 17 };
    mqttService.setSensorForPlanta.mockResolvedValue(501);

    const response = await request(app)
      .post("/api/monitorear")
      .send(payload);

    expectFluent(response.status).to.equal(200);

    expectFluent(response.body).to.deep.equal({
      ok: true,
      id_sensor: 501,
    });

    expect(mqttService.setSensorForPlanta).toHaveBeenCalledTimes(1);
    expect(mqttService.setSensorForPlanta).toHaveBeenCalledWith(17);
  });

  test("P3 - Debe responder 500 cuando ocurre un error al preparar el monitoreo", async () => {
    const payload = { id_planta_usuario: 17 };
    mqttService.setSensorForPlanta.mockRejectedValue(new Error("Fallo interno"));

    const response = await request(app)
      .post("/api/monitorear")
      .send(payload);

    expectFluent(response.status).to.equal(500);

    expectFluent(response.body).to.deep.equal({
      ok: false,
      error: "No se pudo preparar el monitoreo",
    });

    expect(mqttService.setSensorForPlanta).toHaveBeenCalledTimes(1);
    expect(mqttService.setSensorForPlanta).toHaveBeenCalledWith(17);
  });
});