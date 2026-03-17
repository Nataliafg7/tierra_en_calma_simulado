// backend/__tests__/HU25B_p1.test.js
const request = require("supertest");

describe("HU25 – Backend – Escenario 1 (P1) – Consulta exitosa del último dato", () => {
  test("P1 – GET /api/datos debe responder 200 y traer { dato: <string> }", async () => {
    process.env.NODE_ENV = "test";

    // Cargar app real
    const app = require("../server");
    const mqttService = require("../mqttService");

    const esperado = mqttService.getUltimoDato();

    const res = await request(app).get("/api/datos");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("dato");

    // Como no hay validaciones, normalmente será "Esperando datos..." si no se actualizó
    expect(res.body.dato).toBe(esperado);
  });
});