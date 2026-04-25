// Nueva

const request = require("supertest");
const { expect: expectFluent } = require("chai");
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
    expectFluent(res.status).to.equal(400);

    expectFluent(res.body).to.deep.equal({
      error: "id_planta_usuario, fecha y tipo son obligatorios"
    });
  });
});