const pkgCentralService = require('../pkgCentralService');
const oracledb = require('oracledb');
const mqttService = require('../mqttService');

jest.mock('oracledb', () => {
  return {
    getConnection: jest.fn(),
    OUT_FORMAT_OBJECT: 4002,
    BIND_OUT: 3003,
    NUMBER: 2002,
    STRING: 2001,
  };
});

describe('Servicio pkgCentralService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('verificarCondiciones: Debería retornar "Riego automático activado" y accionar el MQTT físico', async () => {
    // Arrange
    const connectionMock = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(true)
    };
    oracledb.getConnection.mockResolvedValue(connectionMock);

    connectionMock.execute.mockResolvedValueOnce({
      rows: [{ TEMPERATURA: 22.5, HUMEDAD: 15 }] // 15% simula sequía → umbral de riego
    });

    connectionMock.execute.mockResolvedValueOnce({
      outBinds: { out_msg: "Riego automático activado. Última lectura: 22.5°C / 15%." }
    });

    const spyRiegoFisico = jest.spyOn(mqttService, 'enviarComandoFisicoRiego').mockResolvedValue({ ok: true });

    // Act
    const resultado = await pkgCentralService.verificarCondiciones(100);

    // Assert (Fluent)
    // El resultado debe indicar éxito (ok: true) y el mensaje debe mencionar riego automático
    expect(resultado).toHaveProperty('ok', true);
    expect(resultado.ok).toBeTrue();
    expect(resultado.mensaje).toBeString().toContain("Riego automático activado");
    expect(spyRiegoFisico).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });

  test('verificarCondiciones: Debería alertar que no hay lecturas si la BD retorna vacío', async () => {
    // Arrange
    const connectionMock = {
      execute: jest.fn()
          .mockResolvedValueOnce({ rows: [] }),
      close: jest.fn().mockResolvedValue(true)
    };
    oracledb.getConnection.mockResolvedValue(connectionMock);

    // Act
    const resultado = await pkgCentralService.verificarCondiciones(1);

    // Assert (Fluent)
    // Cuando no hay lecturas, ok debe ser false y el mensaje debe ser descriptivo
    expect(resultado).toHaveProperty('ok', false);
    expect(resultado.ok).toBeFalse();
    expect(resultado.mensaje).toBeString().toBe("No hay lecturas registradas para esta planta.");
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });

  test('verificarCondiciones: Debería manejar errores de DB 500 y retornar false', async () => {
    // Arrange
    oracledb.getConnection.mockRejectedValue(new Error("Database offline"));
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const resultado = await pkgCentralService.verificarCondiciones(1);

    // Assert (Fluent)
    // Ante error de DB, ok debe ser false y el mensaje de error debe ser claro
    expect(resultado).toHaveProperty('ok', false);
    expect(resultado.ok).toBeFalse();
    expect(resultado.mensaje).toBeString().toBe("Error al ejecutar la verificación.");
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
