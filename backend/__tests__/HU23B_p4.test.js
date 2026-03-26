// Nueva

const request = require("supertest");
const app = require("../server");

describe("HU23 – Backend – Escenario adicional – Todos los campos obligatorios faltan", () => {
  test("Debe responder 400 cuando no se envía id_planta_usuario, fecha ni tipo", async () => {
    // Arrange
    const payload = {};

    // Act
    const res = await request(app)
      .post("/api/cuidados")
      .send(payload);

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "id_planta_usuario, fecha y tipo son obligatorios"
    });
  });
});