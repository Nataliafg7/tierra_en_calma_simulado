/**
 * PRUEBAS DE REGRESIÓN - BACKEND
 *
 * Funcionalidades Angie evaluadas:
 * HU19 - Simulación de riego manual
 * HU20 - Registro automático del evento de riego en el historial
 * HU21 - Actualización de lecturas ambientales
 * HU23 - Registro de cuidados
 * HU25 - Generación de gráfico humedad-temperatura
 *
 * Propósito:
 * Comprobar que las funcionalidades principales asociadas al riego,
 * sensores, lecturas ambientales, cuidados e historial continúan
 * funcionando después de cambios en el código.
 *
 * Nota:
 * HU19 y HU20 se prueban directamente desde mqttService.enviarComandoRiego(),
 * porque en app.js no existe una ruta /api/regar expuesta para backend.
 */

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

const oracledb = require("oracledb");
const mqttService = require("../mqttService");
const cuidadosService = require("../cuidadosService");
const pkgCentralService = require("../pkgCentralService");

describe("Regresión backend - HU19, HU20, HU21, HU23 y HU25", () => {
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
  });

  test("HU19 - ejecuta riego manual cuando existe conexión MQTT y sensor activo", async () => {
    mqttService.initMQTTBroker("mqtt://test", {}, "plantas/datos");

    connectionMock.execute
      .mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 15 }],
      })
      .mockResolvedValueOnce({
        rows: [{ ID_LECTURA: 90, FECHA_HORA: new Date() }],
      })
      .mockResolvedValueOnce({
        rowsAffected: 1,
      });

    await mqttService.setSensorForPlanta(10);

    const resultado = await mqttService.enviarComandoRiego();

    expect(resultado.ok).toBe(true);
    expect(resultado.id_sensor).toBe(15);
    expect(resultado.id_lectura).toBe(90);
    expect(mockPublish).toHaveBeenCalledWith("plantas/regar", "REGAR");
  });

  test("HU20 - registra automáticamente el evento de riego en historial", async () => {
    mqttService.initMQTTBroker("mqtt://test", {}, "plantas/datos");

    connectionMock.execute
      .mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 22 }],
      })
      .mockResolvedValueOnce({
        rows: [{ ID_LECTURA: 101, FECHA_HORA: new Date() }],
      })
      .mockResolvedValueOnce({
        rowsAffected: 1,
      });

    await mqttService.setSensorForPlanta(12);

    const resultado = await mqttService.enviarComandoRiego();

    expect(resultado.ok).toBe(true);

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.RIEGO"),
      expect.objectContaining({
        id_lectura: 101,
        tipo: "manual",
        dur: 5,
        motivo: "Riego manual activado",
      }),
      { autoCommit: true }
    );
  });

  test("HU21 - procesa y guarda una lectura ambiental de temperatura y humedad", async () => {
    connectionMock.execute
      .mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 30 }],
      })
      .mockResolvedValueOnce({
        outBinds: {
          out_id: [501],
        },
        rowsAffected: 1,
      });

    await mqttService.setSensorForPlanta(20);

    await mqttService.procesarDatoMQTT("T:26.45,H:65.25%");

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.LECTURA_SENSORES"),
      expect.objectContaining({
        id_sensor: 30,
        temperatura: 26.45,
        humedad: 65.25,
      }),
      { autoCommit: true }
    );
  });

  test("HU23 - registra un cuidado asociado a una planta", async () => {
    connectionMock.execute
      .mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 40 }],
      })
      .mockResolvedValueOnce({
        rows: [{ ID_LECTURA: 300 }],
      })
      .mockResolvedValueOnce({
        rows: [{ ID_RIEGO: 700 }],
      })
      .mockResolvedValueOnce({
        outBinds: {
          id_out: [900],
        },
        rowsAffected: 1,
      });

    const resultado = await cuidadosService.crearCuidado({
      id_planta_usuario: 25,
      fecha: "2026-03-04",
      tipo_cuidado: "Poda",
      detalle: "Retiro de hojas secas",
    });

    expect(resultado.id_cuidado).toBe(900);
    expect(resultado.id_riego).toBe(700);

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.HISTORIAL_CUIDADOS"),
      expect.objectContaining({
        id_pu: 25,
        id_riego: 700,
        fecha: "2026-03-04",
        tipo_cuidado: "Poda",
        detalle: "Retiro de hojas secas",
      }),
      { autoCommit: true }
    );
  });

  test("HU25 - obtiene información de humedad y temperatura para análisis gráfico", async () => {
    connectionMock.execute
      .mockResolvedValueOnce({
        rows: [
          {
            TEMPERATURA: 31,
            HUMEDAD: 38,
          },
        ],
      })
      .mockResolvedValueOnce({
        outBinds: {
          out_msg: "Riego automático activado",
        },
      });

    const resultado = await pkgCentralService.verificarCondiciones(25);

    expect(resultado.ok).toBe(true);
    expect(resultado.mensaje).toContain("31°C");
    expect(resultado.mensaje).toContain("38%");
    expect(resultado.mensaje).toContain("Riego automático activado");
  });
});