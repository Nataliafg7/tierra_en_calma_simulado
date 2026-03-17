// __tests__/HU20B_p1.test.js
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../server");

describe("HU20 Backend - P1 Endpoint /api/regar debe retornar 500 cuando no se puede enviar", () => {
  test("P1 - (Esperado por CFG) debería responder 500 si enviarComandoRiego falla", async () => {
    // ACT
    const res = await request(app).post("/api/regar").send({});

    // ASSERT
    // Nota: El endpoint casi siempre devuelve 200 porque NO usa await y evalúa una Promise como truthy.
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});