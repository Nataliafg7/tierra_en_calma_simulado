// __tests__/HU20B_p5.test.js
// HU20 - Escenario P5: éxito completo NO alcanzable sin MQTT

process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend – Escenario P5 – Flujo exitoso no alcanzable sin MQTT", () => {

  afterAll(() => {
    // Detener simulador para evitar timers activos
    mqttService.stopSimulator();
  });

  test("Escenario P5 – Retorna { ok:false } porque no hay MQTT conectado y no se ejecuta SELECT/INSERT", async () => {
    // Arrange
    mqttService.initMQTTSimulator({ everyMs: 2000 });

    // Act
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // Assert
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);

    // El flujo NO debe llegar a BD, por eso no hay 'error'
    expect(r).not.toHaveProperty("error");
  });

});