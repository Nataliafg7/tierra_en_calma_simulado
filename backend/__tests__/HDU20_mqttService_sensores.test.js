const { expect: expectFluent } = require("chai");

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

const oracledb = require("oracledb");
const mqttService = require("../mqttService");

describe("HDU20 - mqttService sensores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P1 - ensureSensorForPlanta debe retornar el sensor existente cuando ya está registrado", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute.mockResolvedValueOnce({
      rows: [{ ID_SENSOR: 88 }],
    });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const resultado = await mqttService.ensureSensorForPlanta(10);

    expectFluent(resultado).to.equal(88);
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(fakeConnection.execute).toHaveBeenCalledTimes(1);
    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P2 - ensureSensorForPlanta debe crear un sensor cuando no existe uno previo", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        outBinds: { out_id: [321] },
      });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const resultado = await mqttService.ensureSensorForPlanta(15);

    expectFluent(resultado).to.equal(321);
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(fakeConnection.execute).toHaveBeenCalledTimes(2);
    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P3 - setSensorForPlanta debe devolver el id del sensor activo", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute.mockResolvedValueOnce({
      rows: [{ ID_SENSOR: 500 }],
    });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const resultado = await mqttService.setSensorForPlanta(99);

    expectFluent(resultado).to.equal(500);
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P4 - ensureSensorForPlanta debe cerrar conexión incluso si ocurre un error", async () => {
    const fakeConnection = {
      execute: jest.fn().mockRejectedValue(new Error("Error en execute")),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    await expect(
      mqttService.ensureSensorForPlanta(7)
    ).rejects.toThrow("Error en execute");

    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });
});