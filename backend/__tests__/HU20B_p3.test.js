// __tests__/HU20B_p3.test.js
// HU20 - Escenario P3: modo simulador sin broker MQTT

process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend – Escenario P3 – Modo simulador", () => {
  afterAll(() => {
    // Detener el simulador para evitar intervalos activos en Jest
    mqttService.stopSimulator();
  });

  test("Escenario P3 – Retorna { ok:false } porque no hay cliente MQTT conectado en modo simulador", async () => {
    // Arrange
    mqttService.initMQTTSimulator({ everyMs: 2000 });

    // Act
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // Assert
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);
  });
});