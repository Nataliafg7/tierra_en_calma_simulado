const request = require("supertest");

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
    mqttService.getUltimoDato.mockReturnValue("T:24.50,H:61.20%");

    // Act
    const res = await request(app).get("/api/datos");

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ dato: "T:24.50,H:61.20%" });
  });
});