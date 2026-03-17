const request = require("supertest");
const app = require("../server");

describe("HU18 – Verificar condiciones – Escenario 1 (P1)", () => {

  test("Debe retornar 400 cuando id_planta_usuario es inválido", async () => {

    const response = await request(app)
      .post("/api/verificar-condiciones")
      .send({ id_planta_usuario: "-2" }); // inválido

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toContain("inválido");

  });

});