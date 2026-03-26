// Nueva

const request = require("supertest");

jest.mock("../cuidadosService", () => ({
  crearCuidado: jest.fn()
}));

const cuidadosService = require("../cuidadosService");
const app = require("../server");

describe("HU23 – Backend – Escenario adicional – Conversión numérica de id_planta_usuario", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Debe convertir id_planta_usuario a número antes de llamar al servicio", async () => {
    // Arrange
    const payload = {
      id_planta_usuario: "7",
      fecha: "2026-03-04",
      tipo: "poda",
      detalles: "Recorte de hojas secas"
    };

    cuidadosService.crearCuidado.mockResolvedValue({
      id_cuidado: 301,
      id_riego: 0
    });

    // Act
    const res = await request(app)
      .post("/api/cuidados")
      .send(payload);

    // Assert
    expect(cuidadosService.crearCuidado).toHaveBeenCalledWith({
      id_planta_usuario: 7,
      fecha: "2026-03-04",
      tipo_cuidado: "poda",
      detalle: "Recorte de hojas secas"
    });
    expect(res.status).toBe(201);
  });
});