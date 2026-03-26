// Nueva

describe("HU21  Backend  Escenario adicional  Callback síncrono ejecutado múltiples veces", () => {
  test("Debe ejecutar el callback varias veces mientras el simulador está activo", () => {
    // Arrange
    jest.useFakeTimers();
    jest.resetModules();

    const { startSimulator, stopSimulator } = require("../SimuladorSensor");
    let llamadas = 0;

    const onDato = () => {
      llamadas += 1;
    };

    // Act
    startSimulator({ everyMs: 250, onDato });
    jest.advanceTimersByTime(1250);
    stopSimulator();
    jest.useRealTimers();

    // Assert
    expect(llamadas).toBeGreaterThanOrEqual(4);
  });
});