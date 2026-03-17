// backend/__tests__/HU12B_p4_assert.test.js

describe("HU12–13 - Simulación T/H (sin mocks) - P4", () => {
  test("P4 - stopSimulator detiene la generación de datos", (done) => {
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");

    let contador = 0;

    // Callback real para contar cuántas veces se genera dato
    function onDato(dato) {
      contador++;
    }

    // 1. Inicio el simulador
    expect(() => {
      startSimulator({ everyMs: 10, onDato });
    }).not.toThrow();

    // 2. Espero un poco para que se generen datos
    setTimeout(() => {
      const llamadasAntesDeDetener = contador;

      // Debe haber generado al menos 1 dato
      expect(llamadasAntesDeDetener).toBeGreaterThan(0);

      // 3. Detengo el simulador
      expect(() => {
        stopSimulator();
      }).not.toThrow();

      // 4. Espero más tiempo para verificar que ya no aumente
      setTimeout(() => {
        const llamadasDespues = contador;

        // Assertion clave: no deben haberse generado más datos
        expect(llamadasDespues).toBe(llamadasAntesDeDetener);

        done();
      }, 40);

    }, 40);
  });
});