// backend/__tests__/HU12B_p5_assert_rangos.test.js

describe("HU12–13 - Simulación T/H (sin mocks) - Invariante de rangos", () => {
  test("P5 - Todas las lecturas respetan los rangos definidos (T 0–45, H 0–90)", (done) => {
    const { startSimulator, stopSimulator } = require("../SimuladorSensor");

    const lecturas = [];

    // Callback real que almacena todas las lecturas
    function onDato(dato) {
      lecturas.push(dato);
    }

    // Inicio simulación con intervalo corto
    startSimulator({ everyMs: 10, onDato });

    setTimeout(() => {
      // Deben haberse generado varias lecturas
      expect(lecturas.length).toBeGreaterThanOrEqual(5);

      // Verifico cada lectura capturada
      for (const dato of lecturas) {
        // Ejemplo: "T:24.35,H:55.19%"
        const limpio = dato.replace("%", "");
        const partes = limpio.split(",");

        const temperatura = Number(partes[0].split(":")[1]);
        const humedad = Number(partes[1].split(":")[1]);

        // Assertions de rango
        expect(temperatura).toBeGreaterThanOrEqual(0);
        expect(temperatura).toBeLessThanOrEqual(45);

        expect(humedad).toBeGreaterThanOrEqual(0);
        expect(humedad).toBeLessThanOrEqual(90);
      }

      stopSimulator();
      done();
    }, 100); // esperamos un poco más para capturar varias lecturas
  });
});