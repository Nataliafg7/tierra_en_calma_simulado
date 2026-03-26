// __tests__/HU21B_p3.test.js
// HU21 - Escenario P3: el callback falla, pero el ciclo del simulador no se detiene

describe("HU21 Backend Escenario P3 Callback falla pero no rompe el ciclo", () => {
  test("Escenario P3 Si el callback retorna Promise.reject, el setInterval sigue ejecutándose", () => {
    // Arrange
    jest.useFakeTimers();
    jest.resetModules();

    const { startSimulator, stopSimulator } = require("../SimuladorSensor");
    const mqttService = require("../mqttService");

    const ultimoAntes = mqttService.getUltimoDato();
    const longitudAntes = mqttService.getHistorial().length;

    let llamadas = 0;

    const onDatoFalla = () => {
      llamadas += 1;
      return Promise.reject(new Error("Falla"));
    };

    // Act
    startSimulator({ everyMs: 300, onDato: onDatoFalla });
    jest.advanceTimersByTime(2000);
    stopSimulator();
    jest.useRealTimers();

    // Assert
    expect(llamadas).toBeGreaterThanOrEqual(3);
    expect(mqttService.getUltimoDato()).toBe(ultimoAntes);
    expect(mqttService.getHistorial().length).toBe(longitudAntes);
  });
});