const request = require('supertest');
const nodemailer = require('nodemailer');
const oracledb = require('oracledb');
const app = require('../server');
const mqttService = require('../mqttService');

jest.mock('oracledb', () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 4002,
  BIND_OUT: 3003,
  NUMBER: 2002,
  STRING: 2001,
}));

jest.mock('../mqttService', () => ({
  getUltimoDato: jest.fn(),
  getHistorial: jest.fn(),
  enviarComandoRiego: jest.fn(),
  setSensorForPlanta: jest.fn(),
  initMQTTClient: jest.fn(),
  initMQTTSimulator: jest.fn()
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn() }))
}));

jest.mock('../pkgCentralService', () => ({
  verificarCondiciones: jest.fn()
}));

jest.mock('../cuidadosService', () => ({
  crearCuidado: jest.fn()
}));

const cuidadosService = require('../cuidadosService');

describe('Rutas Server (server.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Usuarios', () => {
    test('POST /api/register - Exito 200', async () => {
      const connectionMock = { execute: jest.fn().mockResolvedValue({}), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);

      const res = await request(app).post('/api/register').send({
        id_usuario: 1, nombre: 'A', apellido: 'B', telefono: '1', correo_electronico: 'a@a.com', contrasena: '123'
      });
      expect(res.status).toBe(200);
    });

    test('POST /api/register - Falla 500', async () => {
      oracledb.getConnection.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).post('/api/register').send({});
      expect(res.status).toBe(500);
    });

    test('POST /api/login - Exito Admin 200', async () => {
      const connectionMock = { 
        execute: jest.fn().mockResolvedValue({
          rows: [{ ID_USUARIO: 1, CORREO_ELECTRONICO: 'admin@tierraencalma.com' }]
        }), 
        close: jest.fn() 
      };
      oracledb.getConnection.mockResolvedValue(connectionMock);

      const res = await request(app).post('/api/login').send({ correo_electronico: 'admin@tierraencalma.com', contrasena: '123' });
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');
    });

    test('POST /api/login - Credenciales invalidas 401', async () => {
      const connectionMock = { 
        execute: jest.fn().mockResolvedValue({ rows: [] }), 
        close: jest.fn() 
      };
      oracledb.getConnection.mockResolvedValue(connectionMock);

      const res = await request(app).post('/api/login').send({ correo_electronico: 'test@tierraencalma.com', contrasena: '123' });
      expect(res.status).toBe(401);
    });

    test('POST /api/login - Falla 500', async () => {
      oracledb.getConnection.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).post('/api/login').send({});
      expect(res.status).toBe(500);
    });

    test('POST /api/contacto - Exito 200', async () => {
      const res = await request(app).post('/api/contacto').send({ nombre: 'n', correo: 'c', mensaje: 'm' });
      expect(res.status).toBe(200);
    });

    test('POST /api/contacto - Faltan campos 400', async () => {
      const res = await request(app).post('/api/contacto').send({});
      expect(res.status).toBe(400);
    });

    test('POST /api/contacto - Falla envio 500', async () => {
      nodemailer.createTransport.mockImplementationOnce(() => ({
        sendMail: jest.fn().mockRejectedValue(new Error('Mail Error'))
      }));
      const res = await request(app).post('/api/contacto').send({ nombre: 'n', correo: 'c', mensaje: 'm' });
      expect(res.status).toBe(500);
    });
  });

  const pkgCentralService = require('../pkgCentralService');

  describe('MQTT y Sensores', () => {
    test('GET /api/datos', async () => {
      mqttService.getUltimoDato.mockReturnValue('T:20,H:50%');
      const res = await request(app).get('/api/datos');
      expect(res.status).toBe(200);
    });

    test('POST /api/regar - Exito (Endpoint 1)', async () => {
      mqttService.enviarComandoRiego.mockResolvedValue({ ok: true });
      const res = await request(app).post('/api/regar');
      // En server.js hay 2 endpoints /api/regar. El primero procesa y retorna 200.
      expect(res.status).toBe(200);
    });

    test('POST /api/monitorear - Falla 400 por string', async () => {
      const res = await request(app).post('/api/monitorear').send({ id_planta_usuario: 'abc' });
      expect(res.status).toBe(400);
    });

    test('POST /api/monitorear - Exito', async () => {
      mqttService.setSensorForPlanta.mockResolvedValue(99);
      const res = await request(app).post('/api/monitorear').send({ id_planta_usuario: 5 });
      expect(res.status).toBe(200);
    });
  });

  describe('Plantas y Vistas', () => {
    test('POST /api/registrar-planta - Exito', async () => {
      const connectionMock = { execute: jest.fn().mockResolvedValue({}), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);
      const res = await request(app).post('/api/registrar-planta').send({ id_usuario: 1, id_planta: 1 });
      expect(res.status).toBe(200);
    });

    test('GET /api/plantas - Exito', async () => {
      const connectionMock = { execute: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);
      const res = await request(app).get('/api/plantas');
      expect(res.status).toBe(200);
    });

    test('GET /api/mis-plantas - Exito', async () => {
      const connectionMock = { execute: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);
      const res = await request(app).get('/api/mis-plantas').set('x-user-id', '1');
      expect(res.status).toBe(200);
    });

    test('POST /api/cuidados - Exito', async () => {
      cuidadosService.crearCuidado.mockResolvedValue({ status: 201 });
      const connectionMock = { execute: jest.fn().mockResolvedValue({ rows: [{ accion: 'regar' }] }), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);
      const res = await request(app).post('/api/cuidados').send({ id_planta_usuario: 1, fecha: '2023-10-10', tipo: 'Regar' });
      expect(res.status).toBe(201);
    });

    test('GET /api/admin/vistas - Exito', async () => {
      const connectionMock = { execute: jest.fn().mockResolvedValue({ rows: [{ dato: 'vista1' }] }), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);
      const res = await request(app).get('/api/admin/vistas');
      expect(res.status).toBe(200);
    });

    test('GET /api/admin/vistas - Falla 500', async () => {
      oracledb.getConnection.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).get('/api/admin/vistas');
      expect(res.status).toBe(500);
    });

    test('POST /api/cuidados - Falla campos vacios 400', async () => {
      const res = await request(app).post('/api/cuidados').send({});
      expect(res.status).toBe(400);
    });

    test('POST /api/registrar-planta - Falla 500', async () => {
      oracledb.getConnection.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).post('/api/registrar-planta').send({ id_usuario: 1, id_planta: 1 });
      expect(res.status).toBe(500);
    });

    test('POST /api/verificar-condiciones - Exito', async () => {
      pkgCentralService.verificarCondiciones.mockResolvedValue({ ok: true });
      const res = await request(app).post('/api/verificar-condiciones').send({ id_planta_usuario: 1 });
      expect(res.status).toBe(200);
    });

    test('POST /api/verificar-condiciones - id invalido 400', async () => {
      const res = await request(app).post('/api/verificar-condiciones').send({ id_planta_usuario: 'abc' });
      expect(res.status).toBe(400);
    });

    test('POST /api/verificar-condiciones - Falla 500', async () => {
      pkgCentralService.verificarCondiciones.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).post('/api/verificar-condiciones').send({ id_planta_usuario: 1 });
      expect(res.status).toBe(500);
    });

    test('Server Boot - testOracleConnection Exito', async () => {
      const connMock = { execute: jest.fn().mockResolvedValue({rows:[['OK']]}), close: jest.fn() };
      oracledb.getConnection.mockResolvedValueOnce(connMock);
      await app.testOracleConnection();
      expect(connMock.close).toHaveBeenCalled();
    });

    test('Server Boot - testOracleConnection Falla', async () => {
      oracledb.getConnection.mockRejectedValueOnce(new Error('Boot Error'));
      const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await app.testOracleConnection();
      logSpy.mockRestore();
    });

    test('Server Boot - Eventos de proceso', () => {
      const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      process.emit('uncaughtException', new Error('Test Error'));
      process.emit('unhandledRejection', new Error('Test Rejection'), Promise.resolve());
      logSpy.mockRestore();
    });
  });
});
