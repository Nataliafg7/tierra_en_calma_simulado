// __tests__/HU25B_p2.test.js
// HU25 - Escenario P2: consulta exitosa del historial

const request = require("supertest");

jest.mock("../mqttService", () => ({
  getHistorial: jest.fn()
}));

const mqttService = require("../mqttService");
const app = require("../server");

describe("HU25 – Backend – Escenario P2 – Consulta exitosa del historial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Escenario P2 – GET /api/historial responde 200 y retorna el historial esperado", async () => {
    // Arrange
    const historialEsperado = [
      "Temperatura: 25°C, Humedad: 60%",
      "Temperatura: 26°C, Humedad: 58%"
    ];

    mqttService.getHistorial.mockReturnValue(historialEsperado);

    // Act
    const res = await request(app).get("/api/historial");

    // Assert
    expect(mqttService.getHistorial).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("historial");
    expect(Array.isArray(res.body.historial)).toBe(true);
    expect(res.body.historial).toEqual(historialEsperado);
  });
});