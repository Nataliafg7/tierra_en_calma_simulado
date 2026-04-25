const mqttService = require('../mqttService');
const oracledb = require('oracledb');
const mqtt = require('mqtt');

jest.mock('oracledb', () => {
  return {
    getConnection: jest.fn(),
    OUT_FORMAT_OBJECT: 4002,
    BIND_OUT: 3003,
    NUMBER: 2002,
    STRING: 2001,
  };
});

// Mock simple de MQTT
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    connected: true
  }))
}));

describe('Servicio MQTT', () => {
  let dateSpy;
  let mClient;

  beforeEach(() => {
    jest.clearAllMocks();
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2023-01-01T00:00:00Z').getTime());

    // Inicializar el cliente antes de cada prueba (nombre real: initMQTTBroker)
    mqttService.initMQTTBroker('mqtt://test', { username: 'a', password: 'b' }, 'plantas/test');

    // Obtener la instancia EXACTA que recibió mqttService
    mClient = mqtt.connect.mock.results[0].value;
    mClient.connected = true; // Asegurar truthiness
  });
  afterEach(() => {
    dateSpy.mockRestore();
  });

  test('setSensorForPlanta: Inserta sensor y devuelve ID si no existe', async () => {
    const connectionMock = {
      execute: jest.fn().mockResolvedValue({ outBinds: { out_id: [100] } }),
      close: jest.fn().mockResolvedValue(true)
    };
    oracledb.getConnection.mockResolvedValue(connectionMock);

    connectionMock.execute.mockResolvedValueOnce({ rows: [] }); // Simula que no existe
    connectionMock.execute.mockResolvedValueOnce({ outBinds: { out_id: [100] } });

    const id = await mqttService.setSensorForPlanta(5);

    // Fluent: el ID retornado debe ser exactamente 100
    expect(id).toBeNumber().toBe(100);
  });

  test('enviarComandoRiego: Envía comando e inserta en DB exitosamente', async () => {
    const connectionMock = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(true)
    };
    // 1st: select sensor (ensureSensor)
    connectionMock.execute.mockResolvedValueOnce({ rows: [{ ID_SENSOR: 5 }] });
    // 2nd: select last lectura (enviarComando)
    connectionMock.execute.mockResolvedValueOnce({ rows: [{ ID_LECTURA: 1 }] });
    // 3rd: insert riego
    connectionMock.execute.mockResolvedValueOnce({});
    oracledb.getConnection.mockResolvedValue(connectionMock);

    await mqttService.setSensorForPlanta(5);

    const result = await mqttService.enviarComandoRiego();

    // Fluent: result debe tener ok=true y id_lectura=1, y execute debe haberse llamado 3 veces
    expect(result.ok).toBeTrue();
    expect(result.id_lectura).toBeNumber().toBe(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(3);
  });

  test('enviarComandoRiego: Falla conexion a DB', async () => {
    const connectionMock = {
      execute: jest.fn().mockResolvedValue({ rows: [{ ID_SENSOR: 9 }] }),
      close: jest.fn().mockResolvedValue(true)
    };
    oracledb.getConnection.mockResolvedValue(connectionMock);
    await mqttService.setSensorForPlanta(9);

    oracledb.getConnection.mockRejectedValueOnce(new Error('DB DOWN'));
    const result = await mqttService.enviarComandoRiego();

    // Fluent: cuando la DB falla, ok debe ser false
    expect(result.ok).toBeFalse();
  });

  test('enviarComandoFisicoRiego: Publica mensaje y retorna ok', async () => {
    const result = await mqttService.enviarComandoFisicoRiego();

    // Fluent: resultado exitoso
    expect(result.ok).toBeTrue();
  });

  test('enviarComandoFisicoRiego: Falla publish de mqtt', async () => {
    mClient.publish.mockImplementationOnce(() => { throw new Error('Crashed') });
    const result = await mqttService.enviarComandoFisicoRiego();

    // Fluent: cuando publish falla, ok debe ser false
    expect(result.ok).toBeFalse();
  });

  test('Eventos MQTT: procesa datos y los inserta en la DB', async () => {
    // El broker MQTT parsea JSON, pero procesarDatoInterno trabaja con el string T:x,H:x%
    // Por eso llamamos directamente a procesarDatoInterno (que es lo que prueba la lógica de negocio)
    const connectionMock = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(true)
    };
    // 1st: select sensor
    connectionMock.execute.mockResolvedValueOnce({ rows: [{ ID_SENSOR: 5 }] });
    // 2nd: insert lectura
    connectionMock.execute.mockResolvedValueOnce({ rowsAffected: 1, outBinds: { out_id: [999] } });
    oracledb.getConnection.mockResolvedValue(connectionMock);

    await mqttService.setSensorForPlanta(5);

    // Invocar directamente el procesador interno con formato texto correcto
    await mqttService.procesarDatoInterno('T:25.5,H:45.3%');

    // Fluent: el último dato debe ser el string enviado y el historial no debe estar vacío
    expect(mqttService.getUltimoDato()).toBeString().toBe('T:25.5,H:45.3%');
    expect(mqttService.getHistorial()).toBeArray().not.toBeEmpty();
    expect(connectionMock.execute).toHaveBeenCalled();

    // Dato inválido (no se inserta en DB)
    await mqttService.procesarDatoInterno('INVALIDO');

    // Dato NaN (no se inserta en DB)
    await mqttService.procesarDatoInterno('T:NaN,H:NaN%');
  });

  test('Eventos MQTT: Falla DB devuelve catch', async () => {
    dateSpy.mockReturnValue(new Date('2023-01-01T01:00:00Z').getTime());

    const connectionMock = {
      execute: jest.fn().mockResolvedValue({ rows: [{ ID_SENSOR: 11 }] }),
      close: jest.fn().mockResolvedValue(true)
    };
    oracledb.getConnection.mockResolvedValue(connectionMock);
    await mqttService.setSensorForPlanta(11);

    // Simular fallo de DB en la siguiente llamada (al insertar lectura)
    oracledb.getConnection.mockRejectedValueOnce(new Error('DB DOWN'));

    const logErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Usar procesarDatoInterno directamente (mismo flujo que el broker)
    await mqttService.procesarDatoInterno('T:25.5,H:45.3%');

    // Fluent: el spy de error debería haber sido invocado al menos una vez
    expect(logErrorSpy).toHaveBeenCalled();
    logErrorSpy.mockRestore();
  });

  test('Riego - Falla estructural: MQTT desconectado rechaza el comando de riego', async () => {
    // Fluent: sin conexión MQTT, el comando de riego debe retornar ok=false
    mClient.connected = false;
    const result = await mqttService.enviarComandoRiego();
    expect(result.ok).toBeFalse();
    // Restablecer para no afectar otros tests
    mClient.connected = true;
  });

  test('Riego - Falla estructural: sin sensor activo el riego es rechazado', async () => {
    // Fluent: si CURRENT_SENSOR_ID es null (nunca se llamó setSensorForPlanta),
    // enviarComandoRiego debe retornar ok=false.
    // Usamos __clearSensorIdForTests para resetear el singleton entre tests.
    mqttService.__clearSensorIdForTests();
    mClient.connected = true;
    const result = await mqttService.enviarComandoRiego();
    expect(result.ok).toBeFalse();
  });

  test('Riego - Falla estructural: MQTT desconectado rechaza el comando físico de riego', async () => {
    // Fluent: sin conexión MQTT, el comando físico de riego debe retornar ok=false
    mClient.connected = false;
    const result = await mqttService.enviarComandoFisicoRiego();
    expect(result.ok).toBeFalse();
    mClient.connected = true;
  });

  test('Riego - Excepcion al cerrar conexion DB', async () => {
    const connectionMock = {
      execute: jest.fn(),
      // El finally en enviarComandoRiego usa catch {} silencioso, por diseño no loguea el error de close
      close: jest.fn().mockRejectedValue(new Error('Close Error'))
    };
    connectionMock.execute.mockResolvedValueOnce({ rows: [{ ID_SENSOR: 15 }] });
    connectionMock.execute.mockResolvedValueOnce({ rows: [{ ID_LECTURA: 1 }] });
    connectionMock.execute.mockResolvedValueOnce({});

    oracledb.getConnection.mockResolvedValue(connectionMock);

    await mqttService.setSensorForPlanta(15);

    // Fluent: enviarComandoRiego debe completarse sin lanzar excepción incluso si close() falla
    const result = await mqttService.enviarComandoRiego();
    expect(result.ok).toBeTrue();
    // Fluent: close fue llamado intentando cerrar la conexión
    expect(connectionMock.close).toHaveBeenCalled();
  });
});
