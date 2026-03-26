// Nueva

jest.mock("mqtt", () => ({
  connect: jest.fn(),
}));

jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: "OUT_FORMAT_OBJECT",
  BIND_OUT: "BIND_OUT",
  NUMBER: "NUMBER",
}));

jest.mock("../SimuladorSensor", () => ({
  startSimulator: jest.fn(),
  stopSimulator: jest.fn(),
}));

const mqtt = require("mqtt");
const oracledb = require("oracledb");
const mqttService = require("../mqttService");

describe("HDU20 / HDU21 / HDU25 - Pruebas internas de mqttService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("P1 - procesarDatoMQTT debe ignorar datos con formato inválido", async () => {
    // Arrange
    const warnSpy = jest.spyOn(console, "warn");

    // Act
    await mqttService.procesarDatoMQTT("dato_invalido");

    // Assert
    expect(warnSpy).toHaveBeenCalled();
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });

  test("P2 - procesarDatoMQTT debe ignorar el dato si no hay sensor activo", async () => {
    // Arrange
    const fakeClient = {
      on: jest.fn(),
      subscribe: jest.fn(),
      publish: jest.fn(),
      connected: true,
    };

    const warnSpy = jest.spyOn(console, "warn");
    mqtt.connect.mockReturnValue(fakeClient);

    mqttService.initMQTTBroker("mqtt://broker-test", {}, "plantas/datos");

    // Act
    await mqttService.procesarDatoMQTT("T:25.00,H:60.00%");

    // Assert
    expect(warnSpy).toHaveBeenCalled();
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });

  test("P3 - procesarDatoMQTT debe ignorar el dato cuando temperatura u humedad son NaN", async () => {
    // Arrange
    const fakeConnectionSensor = {
      execute: jest.fn().mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 40 }],
      }),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection.mockResolvedValueOnce(fakeConnectionSensor);

    await mqttService.setSensorForPlanta(10);

    const warnSpy = jest.spyOn(console, "warn");

    // Act
    await mqttService.procesarDatoMQTT("T:abc,H:50.00%");

    // Assert
    expect(warnSpy).toHaveBeenCalled();
  });

  test("P4 - procesarDatoMQTT debe insertar una lectura correctamente", async () => {
    // Arrange
    const fakeConnectionSensor = {
      execute: jest.fn().mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 77 }],
      }),
      close: jest.fn().mockResolvedValue(),
    };

    const fakeConnectionLectura = {
      execute: jest.fn().mockResolvedValueOnce({
        outBinds: { out_id: [555] },
        rowsAffected: 1,
      }),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection
      .mockResolvedValueOnce(fakeConnectionSensor)
      .mockResolvedValueOnce(fakeConnectionLectura);

    await mqttService.setSensorForPlanta(5);

    // Act
    await mqttService.procesarDatoMQTT("T:24.50,H:61.20%");

    // Assert
    expect(oracledb.getConnection).toHaveBeenCalledTimes(2);
    expect(fakeConnectionLectura.execute).toHaveBeenCalledTimes(1);
    expect(fakeConnectionLectura.close).toHaveBeenCalledTimes(1);
  });

  test("P5 - procesarDatoMQTT debe manejar error de Oracle sin romperse", async () => {
    // Arrange
    const fakeConnectionSensor = {
      execute: jest.fn().mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 88 }],
      }),
      close: jest.fn().mockResolvedValue(),
    };

    const errorSpy = jest.spyOn(console, "error");

    oracledb.getConnection
      .mockResolvedValueOnce(fakeConnectionSensor)
      .mockRejectedValueOnce(new Error("Fallo Oracle"));

    await mqttService.setSensorForPlanta(3);

    // Act
    await mqttService.procesarDatoMQTT("T:26.10,H:63.00%");

    // Assert
    expect(errorSpy).toHaveBeenCalled();
  });

  test("P6 - procesarDatoInterno debe actualizar ultimoDato e historial aunque no haya sensor activo", async () => {
    // Arrange

    // Act
    await mqttService.procesarDatoInterno("T:20.00,H:50.00%");

    // Assert
    expect(mqttService.getUltimoDato()).toBe("T:20.00,H:50.00%");
    expect(mqttService.getHistorial()).toContain("T:20.00,H:50.00%");
  });

  test("P7 - procesarDatoInterno debe intentar persistir cuando ya existe sensor activo", async () => {
    // Arrange
    const fakeConnectionSensor = {
      execute: jest.fn().mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 101 }],
      }),
      close: jest.fn().mockResolvedValue(),
    };

    const fakeConnectionLectura = {
      execute: jest.fn().mockResolvedValueOnce({
        outBinds: { out_id: [700] },
        rowsAffected: 1,
      }),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection
      .mockResolvedValueOnce(fakeConnectionSensor)
      .mockResolvedValueOnce(fakeConnectionLectura);

    await mqttService.setSensorForPlanta(12);

    // Act
    await mqttService.procesarDatoInterno("T:21.00,H:51.00%");

    // Assert
    expect(oracledb.getConnection).toHaveBeenCalledTimes(2);
    expect(fakeConnectionLectura.execute).toHaveBeenCalledTimes(1);
  });

  test("P8 - procesarDatoInterno debe acumular historial en memoria", async () => {
    // Arrange

    // Act
    await mqttService.procesarDatoInterno("T:22.00,H:52.00%");
    await mqttService.procesarDatoInterno("T:23.00,H:53.00%");

    // Assert
    const historial = mqttService.getHistorial();
    expect(historial).toContain("T:22.00,H:52.00%");
    expect(historial).toContain("T:23.00,H:53.00%");
  });

  test("P9 - enviarComandoRiego debe funcionar aunque no exista lectura previa", async () => {
    // Arrange
    const fakeClient = {
      on: jest.fn(),
      subscribe: jest.fn(),
      publish: jest.fn(),
      connected: true,
    };

    mqtt.connect.mockReturnValue(fakeClient);
    mqttService.initMQTTBroker("mqtt://broker-test", {}, "plantas/datos");

    const fakeConnectionSensor = {
      execute: jest.fn().mockResolvedValueOnce({
        rows: [{ ID_SENSOR: 200 }],
      }),
      close: jest.fn().mockResolvedValue(),
    };

    const fakeConnectionRiego = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rowsAffected: 1,
        }),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection
      .mockResolvedValueOnce(fakeConnectionSensor)
      .mockResolvedValueOnce(fakeConnectionRiego);

    await mqttService.setSensorForPlanta(33);

    // Act
    const resultado = await mqttService.enviarComandoRiego();

    // Assert
    expect(fakeClient.publish).toHaveBeenCalledWith("plantas/regar", "REGAR");
    expect(resultado).toEqual({
      ok: true,
      id_sensor: 200,
      id_lectura: null,
    });
  });
});