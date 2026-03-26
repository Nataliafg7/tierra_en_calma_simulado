// Nueva

const request = require("supertest");

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
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ historial: [] });
  });
});