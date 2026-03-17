// backend/__tests__/HU12B_p3_assert.test.js

describe("HU12–13 - Simulación T/H (sin mocks) - P3", () => {
  test("P3 - Si el callback falla (Promise.reject), la simulación no se detiene", (done) => {
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");

    let llamadas = 0;

    function onDato(dato) {
      llamadas++;
      return Promise.reject(new Error("Fallo intencional en callback"));
    }

    expect(() => {
      startSimulator({ everyMs: 10, onDato });
    }).not.toThrow();

    setTimeout(() => {
      // Si el simulador siguió activo a pesar del error, el callback debió ejecutarse varias veces
      expect(llamadas).toBeGreaterThanOrEqual(2);

      expect(() => {
        stopSimulator();
      }).not.toThrow();

      done();
    }, 50);
  });
});