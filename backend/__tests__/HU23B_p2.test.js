const request = require("supertest");
const { expect: expectFluent } = require("chai");

jest.mock("../cuidadosService", () => ({
  crearCuidado: jest.fn()
}));

const cuidadosService = require("../cuidadosService");
const app = require("../server");

describe("HU23 – Backend – Escenario P2 – Registro exitoso del cuidado", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Escenario P2 – Debe responder 201 y retornar id_cuidado e id_riego", async () => {
    // Arrange
    const payload = {
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      tipo: "fertilizacion",
      detalles: "Aplicación de abono"
    };

    cuidadosService.crearCuidado.mockResolvedValue({
      id_cuidado: 101,
      id_riego: 202
    });

    // Act
    const res = await request(app)
      .post("/api/cuidados")
      .send(payload);

    // Assert (Jest para mocks)
    expect(cuidadosService.crearCuidado).toHaveBeenCalledTimes(1);
    expect(cuidadosService.crearCuidado).toHaveBeenCalledWith({
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      tipo_cuidado: "fertilizacion",
      detalle: "Aplicación de abono"
    });

    // Assert (Fluent)
    expectFluent(res.status).to.equal(201);

    expectFluent(res.body).to.deep.include({
      id_cuidado: 101,
      id_riego: 202
    });
  });
});