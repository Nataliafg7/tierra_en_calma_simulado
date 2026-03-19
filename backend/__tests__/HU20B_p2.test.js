// __tests__/HU20B_p2.test.js
process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend - Escenario 2 (P2) - Fallo por MQTT no conectado", () => {
  test("Debe retornar { ok:false } cuando no hay cliente MQTT inicializado", async () => {
    // ACT
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // ASSERT
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);
  });
});