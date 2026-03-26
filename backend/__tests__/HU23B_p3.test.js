const request = require("supertest");

jest.mock("../cuidadosService", () => ({
  crearCuidado: jest.fn()
}));

const cuidadosService = require("../cuidadosService");
const app = require("../server");

describe("HU23 – Backend – Escenario P3 – Error interno durante el registro", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Escenario P3 – Debe responder 500 cuando el servicio de cuidados falla", async () => {
    // Arrange
    const payload = {
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      tipo: "riego",
      detalles: "Detalle de prueba"
    };

    cuidadosService.crearCuidado.mockRejectedValue(
      new Error("Fallo simulado en crearCuidado")
    );

    // Act
    const res = await request(app)
      .post("/api/cuidados")
      .send(payload);

    // Assert
    expect(cuidadosService.crearCuidado).toHaveBeenCalledTimes(1);
    expect(cuidadosService.crearCuidado).toHaveBeenCalledWith({
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      tipo_cuidado: "riego",
      detalle: "Detalle de prueba"
    });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "No se pudo registrar el cuidado" });
  });
});