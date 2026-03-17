// backend/__tests__/HU21B_p3.test.js

describe("HU21 – Backend – Escenario 3 (P3) – Callback falla pero NO rompe el ciclo", () => {
  test("P3 – Si el callback retorna Promise.reject, el setInterval sigue ejecutándose", () => {
    jest.useFakeTimers();

    jest.resetModules();
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");
    const mqttService = require("../mqttService");

    const ultimoAntes = mqttService.getUltimoDato();
    const lenAntes = mqttService.getHistorial().length;

    let llamadas = 0;

    // Callback que falla de forma ASÍNCRONA (se captura en .catch del simulador)
    const onDatoFalla = () => {
      llamadas += 1;
      return Promise.reject(new Error("Falla"));
    };

    startSimulator({ everyMs: 300, onDato: onDatoFalla });

    // Avanzar tiempo: deben ocurrir varias iteraciones aunque el callback falle
    jest.advanceTimersByTime(2000); // ~6-7 iteraciones

    stopSimulator();
    jest.useRealTimers();

    // La clave del escenario: el ciclo NO se rompe
    expect(llamadas).toBeGreaterThanOrEqual(3);

    // Y como aquí NO se usó procesarDatoInterno, mqttService no debería cambiar
    // (si cambia, es porque algo externo tocó el servicio)
    expect(mqttService.getUltimoDato()).toBe(ultimoAntes);
    expect(mqttService.getHistorial().length).toBe(lenAntes);
  });
});