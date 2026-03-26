// Nueva

const { startSimulator, stopSimulator } = require("../SimuladorSensor");

describe("HDU21 - SimuladorSensor extra", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("P1 - Debe generar un dato con el formato esperado y enviarlo al callback", async () => {
    // Arrange
    const callback = jest.fn().mockResolvedValue();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    startSimulator({ everyMs: 1000, onDato: callback });

    // Act
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatch(/^T:\d+\.\d{2},H:\d+\.\d{2}%$/);

    randomSpy.mockRestore();
  });

  test("P2 - Debe mantener temperatura y humedad dentro de los límites", async () => {
    // Arrange
    const callback = jest.fn().mockResolvedValue();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(1);

    startSimulator({ everyMs: 1000, onDato: callback });

    // Act
    jest.advanceTimersByTime(10000);
    await Promise.resolve();

    // Assert
    const ultimoDato = callback.mock.calls.at(-1)[0];
    const match = ultimoDato.match(/T:(\d+\.\d{2}),H:(\d+\.\d{2})%/);

    const temperatura = Number(match[1]);
    const humedad = Number(match[2]);

    expect(temperatura).toBeGreaterThanOrEqual(0);
    expect(temperatura).toBeLessThanOrEqual(45);
    expect(humedad).toBeGreaterThanOrEqual(0);
    expect(humedad).toBeLessThanOrEqual(90);

    randomSpy.mockRestore();
  });

  test("P3 - Debe registrar error cuando el callback falla", async () => {
    // Arrange
    const callback = jest.fn().mockRejectedValue(new Error("Callback falló"));
    const errorSpy = jest.spyOn(console, "error");

    startSimulator({ everyMs: 1000, onDato: callback });

    // Act
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  test("P4 - stopSimulator no debe fallar aunque ya no haya intervalo activo", () => {
    // Arrange
    stopSimulator();

    // Act
    stopSimulator();

    // Assert
    expect(console.log).toHaveBeenCalledWith("[SIM] Detenido");
  });
});