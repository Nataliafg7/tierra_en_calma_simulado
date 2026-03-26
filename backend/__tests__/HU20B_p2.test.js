// __tests__/HU20B_p2.test.js
// HU20 - Escenario P2: fallo cuando MQTT no está conectado

process.env.NODE_ENV = "test";

const mqttService = require("../mqttService");

describe("HU20 Backend – enviarComandoRiego", () => {

  test("Escenario P2 – Retorna { ok:false } cuando MQTT no está conectado", async () => {
    // Arrange
    // No inicializamos MQTT → client queda undefined (estado real)

    // Act
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // Assert
    expect(r).toBeDefined();
    expect(r).toHaveProperty("ok", false);
  });

});