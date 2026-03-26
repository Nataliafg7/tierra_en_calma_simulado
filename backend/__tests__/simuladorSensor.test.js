const SimuladorSensor = require('../SimuladorSensor');

describe('Servicio SimuladorSensor', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('startSimulator y stopSimulator: Debería generar periódicamente datos en formato correcto (T:valor,H:valor%)', () => {
    // Arrange
    const callbackMock = jest.fn();

    // Act
    SimuladorSensor.startSimulator({ everyMs: 1000, onDato: callbackMock });
    jest.advanceTimersByTime(1100); 

    // Assert
    expect(callbackMock).toHaveBeenCalledTimes(1);
    const datoGenerado = callbackMock.mock.calls[0][0]; 

    expect(typeof datoGenerado).toBe('string');
    expect(datoGenerado).toMatch(/^T:\d+\.?\d*,H:\d+\.?\d*%$/); 

    // Cleanup
    SimuladorSensor.stopSimulator();
  });

  // Simulamos un callback que rompa para que cubra la línea 24-26 "Error procesando dato:"
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

    // Assert
    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("[SIM] Error procesando dato:", errorSut.message);

    // Cleanup
    logSpy.mockRestore();
    SimuladorSensor.stopSimulator();
  });
});
