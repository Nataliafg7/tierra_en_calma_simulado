const request = require("supertest");
const app = require("../server");

describe("HU7 – Backend – P2 (envío exitoso)", () => {
  test("Debe retornar 200 cuando el correo se envía correctamente", async () => {
    const res = await request(app)
      .post("/api/contacto")
      .send({
        nombre: "Ana",
        correo: "ana@test.com",
        mensaje: "Hola, esto es una prueba"
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Mensaje enviado correctamente");
  });
});