const request = require("supertest");
const app = require("../server");

describe("HU7 – Backend – P1 (campos faltantes)", () => {
  test("Debe retornar 400 cuando faltan campos obligatorios", async () => {
    const res = await request(app)
      .post("/api/contacto")
      .send({ nombre: "Ana", correo: "ana@test.com" }); // falta mensaje

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Faltan campos obligatorios");
  });
});