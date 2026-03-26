// __tests__/HU25B_p1.test.js
// HU25 - Escenario P1: consulta exitosa del último dato

const request = require("supertest");

jest.mock("../mqttService", () => ({
  getUltimoDato: jest.fn()
}));

const mqttService = require("../mqttService");
const app = require("../server");

describe("HU25  Backend  Escenario P1  Consulta exitosa del último dato", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Escenario P1  GET /api/datos responde 200 y retorna el último dato", async () => {
    // Arrange
    const datoEsperado = "Temperatura: 25°C, Humedad: 60%";
    mqttService.getUltimoDato.mockReturnValue(datoEsperado);

    // Act
    const res = await request(app).get("/api/datos");

    // Assert
    expect(mqttService.getUltimoDato).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("dato");
    expect(res.body.dato).toBe(datoEsperado);
  });
});