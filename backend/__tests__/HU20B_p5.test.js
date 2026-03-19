// __tests__/HU20B_p5.test.js
process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend - P5 - Éxito completo SELECT+INSERT (NO alcanzable sin broker)", () => {
  afterAll(() => {
    // Asegura detener cualquier simulador/timer
    mqttService.stopSimulator();
  });

  test("Debe retornar { ok:false } porque no hay MQTT conectado, por lo tanto NO se ejecuta SELECT/INSERT", async () => {
    // ARRANGE: modo simulador (no crea client MQTT)
    mqttService.initMQTT(null, { everyMs: 2000 }, null, true);

    // ACT
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // ASSERT
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);

    // Si el flujo hubiera entrado a BD, normalmente existiría 'error' solo en catch.
    // Aquí debe cortar antes, sin 'error'.
    expect(r).not.toHaveProperty("error");
  });
});