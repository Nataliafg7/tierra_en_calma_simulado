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
    
    // Inicializar el cliente antes de cada prueba
    mqttService.initMQTTClient('mqtt://test', { username: 'a', password: 'b' }, 'plantas/test');
    
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
    expect(id).toBe(100);
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
    expect(result.ok).toBe(true);
    expect(result.id_lectura).toBe(1);
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
    expect(result.ok).toBe(false);
  });

  test('enviarComandoFisicoRiego: Publica mensaje y retorna ok', async () => {
    const result = await mqttService.enviarComandoFisicoRiego();
    expect(result.ok).toBe(true);
  });
  
  test('enviarComandoFisicoRiego: Falla publish de mqtt', async () => {
    mClient.publish.mockImplementationOnce(() => { throw new Error('Crashed') });
    const result = await mqttService.enviarComandoFisicoRiego();
    expect(result.ok).toBe(false);
  });

  test('Eventos MQTT: procesa datos y los inserta en la DB', async () => {
    const messageCall = mClient.on.mock.calls.find(c => c[0] === 'message');
    const messageCallback = messageCall[1];

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

    // Call callback with dummy buffer payload
    await messageCallback('plantas/test', Buffer.from('T:25.5,H:45.3%'));

    expect(mqttService.getUltimoDato()).toBe('T:25.5,H:45.3%');
    expect(mqttService.getHistorial().length).toBeGreaterThan(0);
    expect(connectionMock.execute).toHaveBeenCalled();

    // Dato inválido 
    await messageCallback('plantas/test', Buffer.from('INVALIDO'));
    
    // Dato NaN
    await messageCallback('plantas/test', Buffer.from('T:NaN,H:NaN%')); 
  });
  
  test('Eventos MQTT: Falla DB devuelve catch', async () => {
    const messageCall = mClient.on.mock.calls.find(c => c[0] === 'message');
    const messageCallback = messageCall[1];

    dateSpy.mockReturnValue(new Date('2023-01-01T01:00:00Z').getTime()); 
    
    const connectionMock = {
      execute: jest.fn().mockResolvedValue({ rows: [{ ID_SENSOR: 11 }] }),
      close: jest.fn().mockResolvedValue(true)
    };
    oracledb.getConnection.mockResolvedValue(connectionMock);
    await mqttService.setSensorForPlanta(11);

    oracledb.getConnection.mockRejectedValueOnce(new Error('DB DOWN'));

    const logErrorSpy = jest.spyOn(console, 'error').mockImplementation(()=> {});
    await messageCallback('plantas/test', Buffer.from('T:25.5,H:45.3%'));
    logErrorSpy.mockRestore();
  });

  test('Riego - Fallas estructurales (MQTT, Sensor)', async () => {
    mqttService.resetStateTracker();
    mClient.connected = false;
    const r1 = await mqttService.enviarComandoRiego();
    expect(r1.ok).toBe(false);

    mClient.connected = true;
    const r2 = await mqttService.enviarComandoRiego();
    expect(r2.ok).toBe(false); // No sensor activo log

    mClient.connected = false;
    const r3 = await mqttService.enviarComandoFisicoRiego();
    expect(r3.ok).toBe(false);

    mClient.connected = true;
  });

  test('Riego - Excepcion al cerrar conexion DB', async () => {
    const connectionMock = {
      execute: jest.fn(),
      close: jest.fn().mockRejectedValue(new Error('Close Error'))
    };
    connectionMock.execute.mockResolvedValueOnce({ rows: [{ ID_SENSOR: 15 }] }); 
    connectionMock.execute.mockResolvedValueOnce({ rows: [{ ID_LECTURA: 1 }] });
    connectionMock.execute.mockResolvedValueOnce({}); 

    oracledb.getConnection.mockResolvedValue(connectionMock);
    
    await mqttService.setSensorForPlanta(15);

    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await mqttService.enviarComandoRiego();
    logSpy.mockRestore();
  });
});
