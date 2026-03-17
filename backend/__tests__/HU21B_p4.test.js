// backend/__tests__/HU21B_p4.test.js

describe("HU21 – Backend – Escenario 4 (P4) – Detener simulador corta el ciclo", () => {
  test("P4 – Después de stopSimulator(), no se ejecuta más el callback aunque pase el tiempo", () => {
    jest.useFakeTimers();

    jest.resetModules();
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");

    let llamadas = 0;

    // Callback válido (no falla) para contar ejecuciones
    const onDato = () => {
      llamadas += 1;
    };

    // Arrancar simulador rápido
    startSimulator({ everyMs: 200, onDato });

    // Dejar que corra un poco
    jest.advanceTimersByTime(1000); // ~5 llamadas
    const llamadasAntesDeDetener = llamadas;

    // Detener
    stopSimulator();

    // Avanzar más tiempo: NO deberían aparecer nuevas llamadas
    jest.advanceTimersByTime(2000);
    const llamadasDespues = llamadas;

    jest.useRealTimers();

    // Assertions
    expect(llamadasAntesDeDetener).toBeGreaterThan(0);
    expect(llamadasDespues).toBe(llamadasAntesDeDetener);
  });
});