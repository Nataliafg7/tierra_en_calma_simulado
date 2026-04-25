// Nueva

const request = require("supertest");
const { expect: expectFluent } = require("chai");

jest.mock("../mqttService", () => ({
  getHistorial: jest.fn()
}));

const mqttService = require("../mqttService");
const app = require("../server");

describe("HU25 – Backend – Escenario adicional – Historial vacío", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/historial debe responder 200 con historial vacío", async () => {
    // Arrange
    mqttService.getHistorial.mockReturnValue([]);

    // Act
    const res = await request(app).get("/api/historial");

    // Assert
    expectFluent(res.status).to.equal(200);

    expectFluent(res.body).to.deep.equal({
      historial: []
    });
  });
});