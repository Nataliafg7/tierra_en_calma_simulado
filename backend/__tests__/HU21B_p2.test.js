// __tests__/HU21B_p2.test.js
// HU21 - Escenario P2: existe callback y sí actualiza memoria

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
    expect(historialDespues.length).toBeGreaterThan(longitudAntes);
    expect(ultimoDespues).not.toBe(ultimoAntes);
    expect(ultimoDespues).toBe(historialDespues.at(-1));
  });
});