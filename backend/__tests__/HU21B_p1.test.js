// backend/__tests__/HU21B_p1.test.js

describe("HU21 – Backend – Escenario 1 (P1) – No existe callback", () => {
  test("P1 – Genera datos, pero NO actualiza ultimoDato ni historial de mqttService", () => {
    jest.useFakeTimers();

    // Aislar estado del módulo en este archivo
    jest.resetModules();
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");
    const mqttService = require("../mqttService");

    const ultimoAntes = mqttService.getUltimoDato();
    const histAntes = mqttService.getHistorial();
    const lenAntes = histAntes.length;

    // No hay callback
    startSimulator({ everyMs: 1000, onDato: null });

    // Simular varios "ticks" del intervalo
    jest.advanceTimersByTime(4000); // ~4 ejecuciones

    // Detener simulador
    stopSimulator();
    jest.useRealTimers();

    // Assertions: como no hubo callback, mqttService NO debería cambiar
    expect(mqttService.getUltimoDato()).toBe(ultimoAntes);
    expect(mqttService.getHistorial().length).toBe(lenAntes);
  });
});