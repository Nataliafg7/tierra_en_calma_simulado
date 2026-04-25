// Nueva

const { expect: expectFluent } = require("chai");

jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: "OUT_FORMAT_OBJECT",
  BIND_OUT: "BIND_OUT",
  NUMBER: "NUMBER",
}));

const oracledb = require("oracledb");
const { crearCuidado } = require("../cuidadosService");

describe("HDU23 - cuidadosService.crearCuidado", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P1 - Debe registrar el cuidado con id_riego null cuando no existe sensor", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        outBinds: { id_out: [900] },
        rowsAffected: 1,
      });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const datos = {
      id_planta_usuario: 1,
      fecha: "2026-03-25",
      tipo_cuidado: "abonado",
      detalle: "Aplicación de fertilizante",
    };

    const resultado = await crearCuidado(datos);

    expectFluent(resultado).to.deep.equal({
      id_cuidado: 900,
      id_riego: null,
    });

    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P2 - Debe registrar el cuidado con id_riego null cuando existe sensor pero no lectura", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute
      .mockResolvedValueOnce({ rows: [{ ID_SENSOR: 7 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        outBinds: { id_out: [901] },
        rowsAffected: 1,
      });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const datos = {
      id_planta_usuario: 2,
      fecha: "2026-03-25",
      tipo_cuidado: "poda",
      detalle: "Poda ligera",
    };

    const resultado = await crearCuidado(datos);

    expectFluent(resultado).to.deep.equal({
      id_cuidado: 901,
      id_riego: null,
    });

    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P3 - Debe registrar el cuidado con id_riego null cuando existe lectura pero no riego", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute
      .mockResolvedValueOnce({ rows: [{ ID_SENSOR: 7 }] })
      .mockResolvedValueOnce({ rows: [{ ID_LECTURA: 20 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        outBinds: { id_out: [902] },
        rowsAffected: 1,
      });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const datos = {
      id_planta_usuario: 3,
      fecha: "2026-03-25",
      tipo_cuidado: "fumigacion",
      detalle: "Preventiva",
    };

    const resultado = await crearCuidado(datos);

    expectFluent(resultado).to.deep.equal({
      id_cuidado: 902,
      id_riego: null,
    });

    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P4 - Debe registrar el cuidado con el id_riego encontrado", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute
      .mockResolvedValueOnce({ rows: [{ ID_SENSOR: 7 }] })
      .mockResolvedValueOnce({ rows: [{ ID_LECTURA: 20 }] })
      .mockResolvedValueOnce({ rows: [{ ID_RIEGO: 44 }] })
      .mockResolvedValueOnce({
        outBinds: { id_out: [903] },
        rowsAffected: 1,
      });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const datos = {
      id_planta_usuario: 4,
      fecha: "2026-03-25",
      tipo_cuidado: "riego complementario",
      detalle: "Después del monitoreo",
    };

    const resultado = await crearCuidado(datos);

    expectFluent(resultado).to.deep.equal({
      id_cuidado: 903,
      id_riego: 44,
    });

    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P5 - Debe convertir detalle vacío en null", async () => {
    const fakeConnection = {
      execute: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    fakeConnection.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        outBinds: { id_out: [904] },
        rowsAffected: 1,
      });

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const datos = {
      id_planta_usuario: 5,
      fecha: "2026-03-25",
      tipo_cuidado: "revision",
      detalle: "",
    };

    await crearCuidado(datos);

    const parametrosDelInsert = fakeConnection.execute.mock.calls[1][1];

    expectFluent(parametrosDelInsert.detalle).to.equal(null);
    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });

  test("P6 - Debe cerrar conexión aunque ocurra un error", async () => {
    const fakeConnection = {
      execute: jest.fn().mockRejectedValue(new Error("Fallo de Oracle")),
      close: jest.fn().mockResolvedValue(),
    };

    oracledb.getConnection.mockResolvedValue(fakeConnection);

    const datos = {
      id_planta_usuario: 6,
      fecha: "2026-03-25",
      tipo_cuidado: "revision",
      detalle: "Observación general",
    };

    await expect(crearCuidado(datos)).rejects.toThrow("Fallo de Oracle");
    expect(fakeConnection.close).toHaveBeenCalledTimes(1);
  });
});