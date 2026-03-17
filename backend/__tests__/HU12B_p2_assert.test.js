// backend/__tests__/HU12B_p2_assert.test.js

describe("HU12–13 - Simulación T/H (sin mocks) - P2", () => {
  test("P2 - Con callback sin error se capturan datos generados", (done) => {
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");

    // Aquí guardo las lecturas que me van llegando por el callback
    const datos = [];

    // Callback real (sin jest.fn): solo almacena el dato recibido
    function onDato(dato) {
      datos.push(dato);
    }

    // Inicio el simulador con intervalo pequeño para que genere rápido
    expect(() => {
      startSimulator({ everyMs: 10, onDato });
    }).not.toThrow();

    // Espero un poco para que se generen varias lecturas
    setTimeout(() => {
      // Assertion 1: debieron llegar lecturas al callback
      expect(datos.length).toBeGreaterThanOrEqual(2);

      // Assertion 2: verifico el formato básico del dato
      // Ejemplo: "T:24.15,H:55.62%"
      expect(datos[0]).toContain("T:");
      expect(datos[0]).toContain(",H:");
      expect(datos[0]).toContain("%");

      // Detengo el simulador y termino
      expect(() => {
        stopSimulator();
      }).not.toThrow();

      done();
    }, 50);
  });
});