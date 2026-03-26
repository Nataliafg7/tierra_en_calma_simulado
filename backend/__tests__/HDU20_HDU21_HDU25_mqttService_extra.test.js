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
const { startSimulator } = require("../SimuladorSensor");
const mqttService = require("../mqttService");

describe("HDU20 / HDU21 / HDU25 - mqttService extra", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("P1 - initMQTTBroker debe conectarse y suscribirse al topic", () => {
    // Arrange
    const fakeClient = {
      on: jest.fn(),
      subscribe: jest.fn((topic, cb) => cb(null)),
      publish: jest.fn(),
      connected: true,
    };

    const TEST_PASSWORD_PARTS = ["dummy", "test", "pass"];
    const TEST_MQTT_OPTIONS = {
      username: "u",
      password: TEST_PASSWORD_PARTS.join("-"),
    };

    mqtt.connect.mockReturnValue(fakeClient);

    // Act
    mqttService.initMQTTBroker(
      "mqtt://broker-test",
      TEST_MQTT_OPTIONS,
      "plantas/datos"
    );

    const callbackConnect = fakeClient.on.mock.calls.find(
      (call) => call[0] === "connect"
    )[1];
    callbackConnect();

    // Assert
    expect(mqtt.connect).toHaveBeenCalledWith(
      "mqtt://broker-test",
      TEST_MQTT_OPTIONS
    );
    expect(fakeClient.subscribe).toHaveBeenCalledWith(
      "plantas/datos",
      expect.any(Function)
    );
  });

  test("P2 - initMQTTSimulator debe iniciar el simulador con el callback interno", () => {
    // Arrange

    // Act
    mqttService.initMQTTSimulator({ everyMs: 2500 });

    // Assert
    expect(startSimulator).toHaveBeenCalledTimes(1);
    expect(startSimulator).toHaveBeenCalledWith({
      everyMs: 2500,
      onDato: expect.any(Function),
    });
  });

  test("P3 - initMQTTSimulator debe actualizar ultimoDato e historial cuando llega un dato válido", async () => {
    // Arrange
    mqttService.initMQTTSimulator({ everyMs: 2000 });

    const llamada = startSimulator.mock.calls[0][0];
    const onDato = llamada.onDato;

    // Act
    await onDato("T:24.00,H:55.00%");

    // Assert
    expect(mqttService.getUltimoDato()).toBe("T:24.00,H:55.00%");
    expect(mqttService.getHistorial()).toContain("T:24.00,H:55.00%");
  });

  test("P4 - enviarComandoRiego debe fallar cuando MQTT no está conectado", async () => {
    // Arrange
    const fakeClient = {
      on: jest.fn(),
      subscribe: jest.fn(),
      publish: jest.fn(),
      connected: false,
    };

    mqtt.connect.mockReturnValue(fakeClient);

    mqttService.initMQTTBroker("mqtt://broker-test", {}, "plantas/datos");

    // Act
    const resultado = await mqttService.enviarComandoRiego();

    // Assert
    expect(resultado).toEqual({ ok: false });
  });

  test("P5 - enviarComandoRiego debe fallar cuando no hay sensor activo", async () => {
    // Arrange
    const fakeClient = {
      on: jest.fn(),
      subscribe: jest.fn(),
      publish: jest.fn(),
      connected: true,
    };

    mqtt.connect.mockReturnValue(fakeClient);
    mqttService.initMQTTBroker("mqtt://broker-test", {}, "plantas/datos");

    // Act
    const resultado = await mqttService.enviarComandoRiego();

    // Assert
    expect(resultado).toEqual({ ok: false });
    expect(fakeClient.publish).not.toHaveBeenCalled();
  });

  test("P6 - enviarComandoRiego debe enviar comando y registrar riego cuando todo sale bien", async () => {
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
        rows: [{ ID_SENSOR: 77 }],
      }),
      close: jest.fn().mockResolvedValue(),
    };

    const fakeConnectionRiego = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ ID_LECTURA: 900 }],
        })
        .mockResolvedValueOnce({
          rowsAffected: 1,
        }),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection
      .mockResolvedValueOnce(fakeConnectionSensor)
      .mockResolvedValueOnce(fakeConnectionRiego);

    await mqttService.setSensorForPlanta(5);

    // Act
    const resultado = await mqttService.enviarComandoRiego();

    // Assert
    expect(fakeClient.publish).toHaveBeenCalledWith("plantas/regar", "REGAR");
    expect(resultado).toEqual({
      ok: true,
      id_sensor: 77,
      id_lectura: 900,
    });
    expect(fakeConnectionSensor.close).toHaveBeenCalledTimes(1);
    expect(fakeConnectionRiego.close).toHaveBeenCalledTimes(1);
  });

  test("P7 - enviarComandoRiego debe responder ok false cuando Oracle falla", async () => {
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
        rows: [{ ID_SENSOR: 55 }],
      }),
      close: jest.fn().mockResolvedValue(),
    };

    const fakeConnectionRiego = {
      execute: jest.fn().mockRejectedValue(new Error("Fallo DB")),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection
      .mockResolvedValueOnce(fakeConnectionSensor)
      .mockResolvedValueOnce(fakeConnectionRiego);

    await mqttService.setSensorForPlanta(8);

    // Act
    const resultado = await mqttService.enviarComandoRiego();

    // Assert
    expect(fakeClient.publish).toHaveBeenCalledWith("plantas/regar", "REGAR");
    expect(resultado).toEqual({
      ok: false,
      error: "Fallo DB",
    });
    expect(fakeConnectionRiego.close).toHaveBeenCalledTimes(1);
  });

  test("P8 - el callback del broker debe procesar un mensaje y actualizar ultimoDato e historial", async () => {
    // Arrange
    const fakeClient = {
      on: jest.fn(),
      subscribe: jest.fn((topic, cb) => cb(null)),
      publish: jest.fn(),
      connected: true,
    };

    mqtt.connect.mockReturnValue(fakeClient);

    mqttService.initMQTTBroker("mqtt://broker-test", {}, "plantas/datos");

    const callbackMessage = fakeClient.on.mock.calls.find(
      (call) => call[0] === "message"
    )[1];

    // Act
    await callbackMessage("plantas/datos", Buffer.from("T:20.00,H:60.00%"));

    // Assert
    expect(mqttService.getUltimoDato()).toBe("T:20.00,H:60.00%");
    expect(mqttService.getHistorial()).toContain("T:20.00,H:60.00%");
  });

  test("P9 - el callback del broker debe manejar JSON inválido sin romperse", async () => {
    // Arrange
    const fakeClient = {
      on: jest.fn(),
      subscribe: jest.fn((topic, cb) => cb(null)),
      publish: jest.fn(),
      connected: true,
    };

    const errorSpy = jest.spyOn(console, "error");

    mqtt.connect.mockReturnValue(fakeClient);
    mqttService.initMQTTBroker("mqtt://broker-test", {}, "plantas/datos");

    const callbackMessage = fakeClient.on.mock.calls.find(
      (call) => call[0] === "message"
    )[1];

    // Act
    await callbackMessage("plantas/datos", Buffer.from("{dato_mal"));

    // Assert
    expect(errorSpy).toHaveBeenCalled();
  });
});