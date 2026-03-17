// backend/__tests__/HU25B_p2.test.js
const request = require("supertest");

describe("HU25 – Backend – Escenario 2 (P1) – Consulta exitosa del historial", () => {
  test("P1 – GET /api/historial debe responder 200 y traer { historial: <array> }", async () => {
    process.env.NODE_ENV = "test";

    const app = require("../server");
    const mqttService = require("../mqttService");

    const esperado = mqttService.getHistorial();

    const res = await request(app).get("/api/historial");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("historial");

    // Debe ser un arreglo (vacío o con elementos)
    expect(Array.isArray(res.body.historial)).toBe(true);

    // Debe coincidir con lo que retorna el servicio en memoria
    expect(res.body.historial).toEqual(esperado);
  });
});