const request = require("supertest");

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

    // Assert
    expect(cuidadosService.crearCuidado).toHaveBeenCalledTimes(1);
    expect(cuidadosService.crearCuidado).toHaveBeenCalledWith({
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      tipo_cuidado: "fertilizacion",
      detalle: "Aplicación de abono"
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_cuidado", 101);
    expect(res.body).toHaveProperty("id_riego", 202);
  });
});