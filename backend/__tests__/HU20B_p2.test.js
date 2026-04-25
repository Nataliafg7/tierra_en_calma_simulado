// __tests__/HU20B_p2.test.js
// HU20 - Escenario P2: fallo cuando MQTT no está conectado

process.env.NODE_ENV = "test";

const { expect: expectFluent } = require("chai");
const mqttService = require("../mqttService");

describe("HU20 Backend – enviarComandoRiego", () => {

  test("Escenario P2 – Retorna { ok:false } cuando MQTT no está conectado", async () => {
    // Arrange
    // No inicializamos MQTT → client queda undefined

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