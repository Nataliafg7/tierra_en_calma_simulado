const request = require("supertest");
const { expect: expectFluent } = require("chai");

jest.mock("../mqttService", () => ({
  getUltimoDato: jest.fn()
}));

const mqttService = require("../mqttService");
const app = require("../server");

describe("HU25 – Backend – Escenario adicional – Último dato actualizado", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/datos debe responder con un dato actualizado", async () => {
    // Arrange
    const dato = "T:24.50,H:61.20%";
    mqttService.getUltimoDato.mockReturnValue(dato);

    // Act
    const res = await request(app).get("/api/datos");

    // Assert
    expectFluent(res.status).to.equal(200);

    expectFluent(res.body).to.deep.equal({
      dato: dato
    });
  });
});