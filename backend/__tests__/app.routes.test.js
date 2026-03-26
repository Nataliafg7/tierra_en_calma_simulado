const request = require('supertest');
const nodemailer = require('nodemailer');
const oracledb = require('oracledb');
const { createApp } = require('../app');
const mqttService = require('../mqttService');
const cuidadosService = require('../cuidadosService');
const pkgCentralService = require('../pkgCentralService');

const app = createApp();

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

jest.mock('../pkgCentralService', () => ({
  verificarCondiciones: jest.fn()
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn() }))
}));

jest.mock('../cuidadosService', () => ({
  crearCuidado: jest.fn()
}));

describe('Rutas App (app.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Usuarios y Autenticación', () => {
    test('POST /api/register - Exito 200', async () => {
      const connectionMock = { execute: jest.fn().mockResolvedValue({}), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);

      const res = await request(app).post('/api/register').send({
        id_usuario: 1, nombre: 'A', apellido: 'B', telefono: '1', correo_electronico: 'a@a.com', contrasena: '123'
      });
      expect(res.status).toBe(200);
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

    test('POST /api/contacto - Exito 200', async () => {
      const payloadValido = { nombre: 'Ana', correo: 'a@t.com', mensaje: 'Hola' };
      const res = await request(app).post('/api/contacto').send(payloadValido);
      expect(res.status).toBe(200);
    });
  });

  describe('Sensores y Monitoreo', () => {
    test('GET /api/datos', async () => {
      mqttService.getUltimoDato.mockReturnValue('T:20,H:50%');
      const res = await request(app).get('/api/datos');
      expect(res.status).toBe(200);
    });

    test('GET /api/historial', async () => {
      mqttService.getHistorial.mockReturnValue(['Dato 1']);
      const res = await request(app).get('/api/historial');
      expect(res.status).toBe(200);
    });

    test('POST /api/monitorear - Exito', async () => {
      mqttService.setSensorForPlanta.mockResolvedValue(99);
      const res = await request(app).post('/api/monitorear').send({ id_planta_usuario: 5 });
      expect(res.status).toBe(200);
    });

    test('POST /api/verificar-condiciones - Exito', async () => {
      pkgCentralService.verificarCondiciones.mockResolvedValue({ ok: true, mensaje: "OK" });
      const res = await request(app).post('/api/verificar-condiciones').send({ id_planta_usuario: 1 });
      expect(res.status).toBe(200);
    });

    test('POST /api/verificar-condiciones - Falla 500', async () => {
      pkgCentralService.verificarCondiciones.mockRejectedValue(new Error("err"));
      const res = await request(app).post('/api/verificar-condiciones').send({ id_planta_usuario: 1 });
      expect(res.status).toBe(500);
    });
  });

  describe('Gestión de Plantas', () => {
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
      const connectionMock = { execute: jest.fn().mockResolvedValue({ rows: [{ accion: 'regar' }] }), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);
      jest.spyOn(cuidadosService, 'crearCuidado').mockResolvedValue({ status: 201, insertId: 5 });
      const res = await request(app).post('/api/cuidados').send({ id_planta_usuario: 1, fecha: '2023-10-10', tipo: 'Regar' });
      expect(res.status).toBe(201);
    });
    
    test('GET /api/admin/vistas - Exito', async () => {
      const connectionMock = { execute: jest.fn().mockResolvedValue({ rows: [{ dato: 'vista1' }] }), close: jest.fn().mockResolvedValue(true) };
      oracledb.getConnection.mockResolvedValue(connectionMock);
      const res = await request(app).get('/api/admin/vistas');
      expect(res.status).toBe(200);
    });
    test('POST /api/cuidados - Falla faltan datos 400', async () => {
      const res = await request(app).post('/api/cuidados').send({});
      expect(res.status).toBe(400);
    });

    test('GET /api/mis-plantas - Falla null query', async () => {
      const res = await request(app).get('/api/mis-plantas').set('x-user-id', 'test');
      expect(res.status).toBe(400);
    });

    test('GET /api/admin/vistas - Falla DB 500', async () => {
      oracledb.getConnection.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).get('/api/admin/vistas');
      expect(res.status).toBe(500);
    });

    test('POST /api/monitorear - Falla 500', async () => {
      mqttService.setSensorForPlanta.mockRejectedValueOnce(new Error('Monitorear Error'));
      const res = await request(app).post('/api/monitorear').send({ id_planta_usuario: 5 });
      expect(res.status).toBe(500);
    });

    test('POST /api/regar - Exito 200', async () => {
      mqttService.enviarComandoRiego.mockResolvedValueOnce({ ok: true, id_lectura: 1 });
      const res = await request(app).post('/api/regar');
      expect(res.status).toBe(200);
    });

    test('POST /api/regar - Falla 500 Interno', async () => {
      mqttService.enviarComandoRiego.mockRejectedValueOnce(new Error('Riego Error'));
      const res = await request(app).post('/api/regar');
      expect(res.status).toBe(500);
    });

    test('POST /api/regar - Falla 500 de comando', async () => {
      mqttService.enviarComandoRiego.mockResolvedValueOnce({ ok: false, error: 'Comando crasheo' });
      const res = await request(app).post('/api/regar');
      expect(res.status).toBe(500);
    });

    test('GET /api/plantas - Falla 500', async () => {
      oracledb.getConnection.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/plantas');
      expect(res.status).toBe(500);
    });

    test('GET /api/mis-plantas - Falla DB 500', async () => {
      oracledb.getConnection.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/mis-plantas').set('x-user-id', '1');
      expect(res.status).toBe(500);
    });

    test('POST /api/cuidados - Falla 500', async () => {
      cuidadosService.crearCuidado.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).post('/api/cuidados').send({
        id_planta_usuario: 1, fecha: '2023-01-01', tipo: 'Riego', detalles: 'Todo bien'
      });
      expect(res.status).toBe(500);
    });
  });
});
