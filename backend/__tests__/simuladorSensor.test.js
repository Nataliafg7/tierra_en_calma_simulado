const SimuladorSensor = require('../SimuladorSensor');

describe('Servicio SimuladorSensor', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // ─── Generación periódica de datos (Funcionalidad crítica) ────────────────────
  test('startSimulator y stopSimulator: Debería generar periódicamente datos en formato correcto (T:valor,H:valor%)', () => {
    // Arrange
    const callbackMock = jest.fn();

    // Act
    SimuladorSensor.startSimulator({ everyMs: 1000, onDato: callbackMock });
    jest.advanceTimersByTime(1100);

    // Assert (Fluent)
    // El callback debe haberse llamado exactamente una vez en el intervalo
    expect(callbackMock).toHaveBeenCalledTimes(1);

    const datoGenerado = callbackMock.mock.calls[0][0];

    // El dato generado debe ser un string con el formato T:valor,H:valor%
    expect(datoGenerado)
      .toBeString()
      .toMatch(/^T:\d+\.?\d*,H:\d+\.?\d*%$/);

    // Cleanup
    SimuladorSensor.stopSimulator();
  });

  // ─── Registro periódico de lecturas: manejo de errores en el callback ─────────
  test('startSimulator: Debería atrapar errores si onDato lanza una excepción', async () => {
    // Arrange
    const errorSut = new Error("SUT Error");
    const callbackMock = jest.fn().mockRejectedValue(errorSut);
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    SimuladorSensor.startSimulator({ everyMs: 100, onDato: callbackMock });
    jest.advanceTimersByTime(110);

    // Necesitamos que se resuelva la microtarea del Promise.resolve(procesarDatoCallback(dato)).catch()
    await Promise.resolve();

    // Assert (Fluent)
    // El callback debe haberse ejecutado exactamente una vez a pesar del error
    expect(callbackMock).toHaveBeenCalledTimes(1);

    // El error debe haberse registrado con el mensaje correcto
    expect(logSpy)
      .toHaveBeenCalled()
      .toHaveBeenCalledWith("[SIM] Error procesando dato:", errorSut.message);

    // Cleanup
    logSpy.mockRestore();
    SimuladorSensor.stopSimulator();
  });
});
