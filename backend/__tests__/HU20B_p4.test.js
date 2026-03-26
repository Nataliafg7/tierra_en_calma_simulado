// __tests__/HU20B_p4.test.js
// HU20 - Escenario P4: el flujo no alcanza la base de datos porque MQTT no está conectado

process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend – Escenario P4 – Flujo detenido antes de Oracle", () => {
  afterAll(() => {
    mqttService.stopSimulator();
  });

  test("Escenario P4 – Retorna { ok:false } antes de llegar a BD porque no hay MQTT conectado", async () => {
    // Arrange
    mqttService.initMQTTSimulator({ everyMs: 2000 });

    // Act
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // Assert
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);
    expect(r).not.toHaveProperty("error");
  });
});