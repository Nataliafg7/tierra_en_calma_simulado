// __tests__/HU21B_p2.test.js
// HU21 - Escenario P2: existe callback y sí actualiza memoria

const { expect: expectFluent } = require("chai");

describe("HU21 Backend Escenario P2 Existe callback y actualiza memoria", () => {
  test("Escenario P2 En modo simulador, actualiza ultimoDato e incrementa historial", () => {
    // Arrange
    jest.useFakeTimers();
    jest.resetModules();

    const mqttService = require("../mqttService");

    const ultimoAntes = mqttService.getUltimoDato();
    const longitudAntes = mqttService.getHistorial().length;

    // Act
    mqttService.initMQTTSimulator({ everyMs: 500 });
    jest.advanceTimersByTime(2500);
    mqttService.stopSimulator();
    jest.useRealTimers();

    const ultimoDespues = mqttService.getUltimoDato();
    const historialDespues = mqttService.getHistorial();

    // Assert
    expectFluent(historialDespues.length).to.be.greaterThan(longitudAntes);

    expectFluent(ultimoDespues).to.not.equal(ultimoAntes);

    expectFluent(ultimoDespues).to.equal(historialDespues.at(-1));
  });
});