// __tests__/HU20B_p4.test.js
process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend - P4 - Error en conexión a Oracle (NO alcanzable sin broker)", () => {
  afterAll(() => {
    mqttService.stopSimulator();
  });

  test("Debe retornar { ok:false } antes de llegar a BD porque no hay MQTT conectado", async () => {
    // ARRANGE: modo simulador (sin broker)
    mqttService.initMQTT(null, { everyMs: 2000 }, null, true);

    // ACT
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // ASSERT: el flujo se corta en la validación MQTT, no llega a Oracle
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);
    expect(r).not.toHaveProperty("error"); // no hay error de Oracle porque NO entró al try
  });
});