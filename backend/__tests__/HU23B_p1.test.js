const request = require("supertest");

function loadApp() {
  try {
    return require("../server");
  } catch {
    // continuar con el siguiente intento
  }

  try {
    return require("../app");
  } catch {
    // continuar con el siguiente intento
  }

  throw new Error(
    "No se pudo cargar el app. Exporta el Express app en server.js o app.js (module.exports = app)."
  );
}

describe("HU23 – Backend – Escenario P1 – Campos obligatorios faltantes", () => {
  test("Escenario P1 – Debe responder 400 si falta id_planta_usuario, fecha o tipo", async () => {
    // Arrange
    const app = loadApp();

    const payload = {
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      detalle: "Prueba sin tipo"
    };

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