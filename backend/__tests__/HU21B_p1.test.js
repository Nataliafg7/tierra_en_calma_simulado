// __tests__/HU21B_p1.test.js
// HU21 - Escenario P1: no existe callback, por lo tanto no se actualiza mqttService

describe("HU21 – Backend – Escenario P1 – No existe callback", () => {
  test("Escenario P1 – Genera datos, pero no actualiza ultimoDato ni historial de mqttService", () => {
    // Arrange
    jest.useFakeTimers();
    jest.resetModules();

    const { startSimulator, stopSimulator } = require("../SimuladorSensor");
    const mqttService = require("../mqttService");

    const ultimoAntes = mqttService.getUltimoDato();
    const historialAntes = mqttService.getHistorial();
    const longitudAntes = historialAntes.length;

    // Act
    startSimulator({ everyMs: 1000, onDato: null });
    jest.advanceTimersByTime(4000);
    stopSimulator();
    jest.useRealTimers();

    // Assert
    expect(mqttService.getUltimoDato()).toBe(ultimoAntes);
    expect(mqttService.getHistorial().length).toBe(longitudAntes);
  });
});