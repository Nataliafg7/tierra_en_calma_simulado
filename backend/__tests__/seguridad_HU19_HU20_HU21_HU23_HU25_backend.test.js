/**
 * PRUEBAS DE SEGURIDAD - BACKEND
 *
 * Funcionalidades Angie evaluadas:
 * HU19 - Simulación de riego manual
 * HU20 - Registro automático del evento de riego en el historial
 * HU21 - Actualización de lecturas ambientales
 * HU23 - Registro de cuidados
 * HU25 - Generación de gráfico humedad-temperatura
 *
 * Objetivo:
 * Validar que el sistema controle correctamente datos inválidos,
 * evite registros incompletos y no ejecute operaciones cuando falta
 * información crítica como sensor activo, conexión MQTT o datos obligatorios.
 *
 * Enfoque:
 * Se prueban entradas inválidas, ausencia de datos requeridos y errores
 * controlados en servicios asociados a riego, sensores, cuidados y lecturas.
 */

const request = require("supertest");

const mockPublish = jest.fn();

jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
  BIND_OUT: 3003,
  NUMBER: 2010,
  STRING: 2001,
}));

jest.mock("mqtt", () => ({
  connect: jest.fn(() => ({
    connected: true,
    publish: mockPublish,
    on: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

jest.mock("../SimuladorSensor", () => ({
  startSimulator: jest.fn(),
  stopSimulator: jest.fn(),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));

jest.mock("yamljs", () => ({
  load: jest.fn(() => ({})),
}));

const oracledb = require("oracledb");
const mqttService = require("../mqttService");
const cuidadosService = require("../cuidadosService");
const pkgCentralService = require("../pkgCentralService");
const { createApp } = require("../app");

describe("Seguridad backend - HU19, HU20, HU21, HU23 y HU25", () => {
  let app;
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();
    mqttService.__clearSensorIdForTests();

    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
  });

  test("HU19 - no ejecuta riego manual si no existe conexión MQTT activa", async () => {
    const resultado = await mqttService.enviarComandoRiego();

    expect(resultado.ok).toBe(false);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  test("HU20 - no registra riego si no existe sensor activo", async () => {
    mqttService.initMQTTBroker("mqtt://test", {}, "plantas/datos");

    const resultado = await mqttService.enviarComandoRiego();

    expect(resultado.ok).toBe(false);
    expect(mockPublish).not.toHaveBeenCalled();
    expect(connectionMock.execute).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.RIEGO"),
      expect.any(Object),
      expect.any(Object)
    );
  });

  test("HU21 - ignora lectura ambiental con formato inválido", async () => {
    connectionMock.execute.mockResolvedValueOnce({
      rows: [{ ID_SENSOR: 30 }],
    });

    await mqttService.setSensorForPlanta(20);

    await mqttService.procesarDatoMQTT("temperatura-alta-humedad-baja");

    expect(connectionMock.execute).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.LECTURA_SENSORES"),
      expect.any(Object),
      expect.any(Object)
    );
  });

  test("HU21 - no guarda lectura ambiental si no hay sensor activo", async () => {
    await mqttService.procesarDatoMQTT("T:26.45,H:65.25%");

    expect(connectionMock.execute).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.LECTURA_SENSORES"),
      expect.any(Object),
      expect.any(Object)
    );
  });

  test("HU23 - rechaza registro de cuidado sin datos obligatorios", async () => {
    const response = await request(app)
      .post("/api/cuidados")
      .send({
        id_planta_usuario: 10,
        detalles: "Cuidado incompleto",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "id_planta_usuario, fecha y tipo son obligatorios"
    );
  });

  test("HU23 - rechaza registro de cuidado sin id_planta_usuario", async () => {
    const response = await request(app)
      .post("/api/cuidados")
      .send({
        fecha: "2026-03-04",
        tipo: "Poda",
        detalles: "Retiro de hojas secas",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "id_planta_usuario, fecha y tipo son obligatorios"
    );
  });

  test("HU23 - controla error del servicio al registrar cuidado", async () => {
    connectionMock.execute.mockRejectedValueOnce(new Error("Error BD"));

    await expect(
      cuidadosService.crearCuidado({
        id_planta_usuario: 25,
        fecha: "2026-03-04",
        tipo_cuidado: "Poda",
        detalle: "Retiro de hojas secas",
      })
    ).rejects.toThrow("Error BD");
  });

  test("HU25 - rechaza verificación de condiciones con id inválido", async () => {
    const response = await request(app)
      .post("/api/verificar-condiciones")
      .send({
        id_planta_usuario: "abc",
      });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toBe("id_planta_usuario inválido");
  });

  test("HU25 - responde de forma controlada cuando no hay lecturas registradas", async () => {
    connectionMock.execute.mockResolvedValueOnce({
      rows: [],
    });

    const resultado = await pkgCentralService.verificarCondiciones(25);

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toBe(
      "No hay lecturas registradas para esta planta."
    );
  });

  test("HU25 - controla error interno al verificar condiciones", async () => {
    connectionMock.execute.mockRejectedValueOnce(new Error("Error interno"));

    const resultado = await pkgCentralService.verificarCondiciones(25);

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toBe("Error al ejecutar la verificación.");
  });
});