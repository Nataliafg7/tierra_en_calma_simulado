// __tests__/HU20B_p3.test.js
process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend - Escenario 3 (P3) - Modo simulador (sin broker)", () => {
  afterAll(() => {
    // Detener el intervalo del simulador para que Jest no quede con logs/timers activos
    mqttService.stopSimulator();
  });

  test("Debe retornar { ok:false } porque no hay cliente MQTT conectado en modo simulador", async () => {
    // ARRANGE: activar modo simulador (no crea client MQTT)
    mqttService.initMQTT(null, { everyMs: 2000 }, null, true);

    // ACT
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // ASSERT
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);
  });
});