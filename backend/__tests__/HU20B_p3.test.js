// __tests__/HU20B_p3.test.js
// HU20 - Escenario P3: modo simulador sin broker MQTT

process.env.NODE_ENV = "test";

const { expect: expectFluent } = require("chai");
const mqttService = require("../mqttService");

describe("HU20 Backend – Escenario P3 – Modo simulador", () => {
  afterAll(() => {
    mqttService.stopSimulator();
  });

  test("Escenario P3 – Retorna { ok:false } porque no hay cliente MQTT conectado en modo simulador", async () => {
    // Arrange
    mqttService.initMQTTSimulator({ everyMs: 2000 });

    // Act
    const r = await mqttService.enviarComandoRiego("plantas/regar");

    // Assert
    expectFluent(r)
      .to.exist
      .and.to.be.an("object")
      .and.to.have.property("ok")
      .that.equals(false);
  });
});