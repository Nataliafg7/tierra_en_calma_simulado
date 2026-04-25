// __tests__/HU25B_p2.test.js
// HU25 - Escenario P2: consulta exitosa del historial

const request = require("supertest");
const { expect: expectFluent } = require("chai");

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

    // Assert (mock)
    expect(mqttService.getHistorial).toHaveBeenCalledTimes(1);

    // Assert (fluent)
    expectFluent(res.status).to.equal(200);

    expectFluent(res.body)
      .to.be.an("object")
      .and.to.have.property("historial")
      .that.is.an("array");

    expectFluent(res.body.historial).to.deep.equal(historialEsperado);
  });
});