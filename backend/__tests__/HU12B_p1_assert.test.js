// backend/__tests__/HU12B_p1_assert.test.js

describe("HU12–13 - Simulación T/H (sin mocks) - P1", () => {
  test("P1 - Inicia sin callback y se puede detener sin errores", (done) => {
    // Importo el simulador real (sin mocks)
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");

    // Assertion 1: iniciar no debe lanzar error
    expect(() => {
      startSimulator({ everyMs: 10, onDato: null });
    }).not.toThrow();

    // Espero un poquito para que el intervalo alcance a correr
    setTimeout(() => {
      // Assertion 2: detener no debe lanzar error
      expect(() => {
        stopSimulator();
      }).not.toThrow();

      done();
    }, 40);
  });
});