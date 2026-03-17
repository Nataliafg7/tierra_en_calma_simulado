// backend/__tests__/HU21B_p2.test.js

describe("HU21 – Backend – Escenario 2 (P2) – Existe callback y actualiza memoria", () => {
  test("P2 – En modo simulador, debe actualizar ultimoDato e incrementar historial", () => {
    jest.useFakeTimers();

    jest.resetModules();
    const mqttService = require("../mqttService");

    const ultimoAntes = mqttService.getUltimoDato();
    const lenAntes = mqttService.getHistorial().length;

    // Modo simulador: internamente llama startSimulator(... onDato: procesarDatoInterno)
    // brokerUrl/topic no se usan cuando useSimulator=true
    mqttService.initMQTT(
      "mqtt://no-se-usa",
      { everyMs: 500 },
      "topico/no-se-usa",
      true
    );

    // Avanzar tiempo para generar varios datos
    jest.advanceTimersByTime(2500); // ~5 lecturas

    // Detener simulador
    mqttService.stopSimulator();
    jest.useRealTimers();

    const ultimoDespues = mqttService.getUltimoDato();
    const histDespues = mqttService.getHistorial();

    // Assertions esperadas para P2 (deberían pasar si el flujo funciona)
    expect(histDespues.length).toBeGreaterThan(lenAntes);
    expect(ultimoDespues).not.toBe(ultimoAntes);
    expect(ultimoDespues).toBe(histDespues[histDespues.length - 1]);
  });
});