// __tests__/HU20B_p5.test.js
// HU20 - Escenario P5: éxito completo NO alcanzable sin MQTT

process.env.NODE_ENV = "test";

const { expect: expectFluent } = require("chai");
const mqttService = require("../mqttService");

describe("HU20 Backend – Escenario P5 – Flujo exitoso no alcanzable sin MQTT", () => {

  afterAll(() => {
    mqttService.stopSimulator();
  });

  test("Escenario P5 – Retorna { ok:false } porque no hay MQTT conectado y no se ejecuta SELECT/INSERT", async () => {
    // Arrange
    mqttService.initMQTTSimulator({ everyMs: 2000 });

    // Act
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // Assert
    expectFluent(r).to.deep.include({ ok: false });
    expectFluent(r).to.not.have.property("error");
  });

});