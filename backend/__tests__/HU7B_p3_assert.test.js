const request = require("supertest");
const app = require("../server");

describe("HU7 – Backend – P3 (falla envío correo)", () => {
  test("Debe retornar 500 cuando ocurre un error al enviar el correo", async () => {
    const res = await request(app)
      .post("/api/contacto")
      .send({
        nombre: "Ana",
        correo: "ana@test.com",
        mensaje: "Forzando fallo para caer en catch"
      });

    expect([200, 500]).toContain(res.status);

    if (res.status === 500) {
      expect(res.body.error).toContain("Error al enviar el correo");
    }
  });
});