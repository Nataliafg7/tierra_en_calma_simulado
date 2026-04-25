/**
 * PRUEBAS DE RENDIMIENTO - BACKEND
 *
 * Funcionalidades Angie evaluadas:
 * HU19 - Simulación de riego manual
 * HU20 - Registro automático del evento de riego en el historial
 * HU21 - Actualización de lecturas ambientales
 * HU23 - Registro de cuidados
 * HU25 - Generación de gráfico humedad-temperatura
 *
 * Objetivo:
 * Verificar que las funcionalidades respondan en tiempos adecuados
 * y que soporten múltiples ejecuciones sin degradación.
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

describe("Rendimiento backend - HU19, HU20, HU21, HU23 y HU25", () => {
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
  });

  test("HU19 - riego manual responde en tiempo adecuado", async () => {
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

    const inicio = Date.now();

    const resultado = await mqttService.enviarComandoRiego();

    const tiempo = Date.now() - inicio;

    expect(resultado.ok).toBe(true);
    expect(mockPublish).toHaveBeenCalledWith("plantas/regar", "REGAR");
    expect(tiempo).toBeLessThan(1000);
  });

  test("HU20 - registro automático del riego en historial es rápido", async () => {
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

    const inicio = Date.now();

    const resultado = await mqttService.enviarComandoRiego();

    const tiempo = Date.now() - inicio;

    expect(resultado.ok).toBe(true);
    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.RIEGO"),
      expect.any(Object),
      { autoCommit: true }
    );
    expect(tiempo).toBeLessThan(1000);
  });

  test("HU21 - actualización de lectura ambiental responde en tiempo adecuado", async () => {
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

    const inicio = Date.now();

    await mqttService.procesarDatoMQTT("T:26.45,H:65.25%");

    const tiempo = Date.now() - inicio;

    expect(connectionMock.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO TIERRA_EN_CALMA.LECTURA_SENSORES"),
      expect.objectContaining({
        temperatura: 26.45,
        humedad: 65.25,
      }),
      { autoCommit: true }
    );
    expect(tiempo).toBeLessThan(1000);
  });

  test("HU23 - registro de cuidados responde en tiempo adecuado", async () => {
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

    const inicio = Date.now();

    const resultado = await cuidadosService.crearCuidado({
      id_planta_usuario: 25,
      fecha: "2026-03-04",
      tipo_cuidado: "Poda",
      detalle: "Retiro de hojas secas",
    });

    const tiempo = Date.now() - inicio;

    expect(resultado.id_cuidado).toBe(900);
    expect(resultado.id_riego).toBe(700);
    expect(tiempo).toBeLessThan(1000);
  });

  test("HU25 - consulta de humedad y temperatura para gráfico es rápida", async () => {
    connectionMock.execute
      .mockResolvedValueOnce({
        rows: [
          {
            TEMPERATURA: 27,
            HUMEDAD: 60,
          },
        ],
      })
      .mockResolvedValueOnce({
        outBinds: {
          out_msg: "No se requirió riego",
        },
      });

    const inicio = Date.now();

    const resultado = await pkgCentralService.verificarCondiciones(25);

    const tiempo = Date.now() - inicio;

    expect(resultado.ok).toBe(true);
    expect(resultado.mensaje).toContain("27°C");
    expect(resultado.mensaje).toContain("60%");
    expect(tiempo).toBeLessThan(1000);
  });

  test("Carga - múltiples actualizaciones ambientales sin degradación", async () => {
    connectionMock.execute
      .mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 55 }],
      })
      .mockResolvedValue({
        outBinds: {
          out_id: [600],
        },
        rowsAffected: 1,
      });

    await mqttService.setSensorForPlanta(30);

    const inicio = Date.now();

    for (let i = 0; i < 10; i++) {
      await mqttService.procesarDatoMQTT("T:25.50,H:61.20%");
    }

    const tiempo = Date.now() - inicio;

    expect(tiempo).toBeLessThan(2000);
  });
});