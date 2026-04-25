// __tests__/HU21B_p4.test.js
// HU21 - Escenario P4: detener el simulador corta el ciclo

const { expect: expectFluent } = require("chai");

describe("HU21 Backend Escenario P4 Detener simulador corta el ciclo", () => {
  test("Escenario P4 – Después de stopSimulator(), no se ejecuta más el callback aunque pase el tiempo", () => {
    // Arrange
    jest.useFakeTimers();
    jest.resetModules();

    const { startSimulator, stopSimulator } = require("../SimuladorSensor");

    let llamadas = 0;

    const onDato = () => {
      llamadas += 1;
    };

    // Act
    startSimulator({ everyMs: 200, onDato });
    jest.advanceTimersByTime(1000);
    const llamadasAntesDeDetener = llamadas;

    stopSimulator();

    jest.advanceTimersByTime(2000);
    const llamadasDespues = llamadas;

    jest.useRealTimers();

    // Assert
    expectFluent(llamadasAntesDeDetener).to.be.greaterThan(0);
    expectFluent(llamadasDespues).to.equal(llamadasAntesDeDetener);
  });
});