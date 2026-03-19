// backend/__tests__/HU23B_p1.test.js
const request = require("supertest");

function loadApp() {
  // Intenta cargar el app sin modificar tu backend
  try { return require("../server"); } catch (e1) {}
  try { return require("../app"); } catch (e2) {}
  throw new Error("No se pudo cargar el app. Exporta el Express app en server.js o app.js (module.exports = app).");
}

describe("HU23 – Backend – Escenario 1 (P1) – Campos obligatorios faltantes", () => {
  test("P1 – Debe responder 400 si falta id_planta_usuario/fecha/tipo", async () => {
    const app = loadApp();

    // Falta tipo (y puedes variar para faltar fecha o id_planta_usuario)
    const payload = {
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      // tipo_cuidado: "riego"  <-- faltante a propósito
      detalle: "Prueba sin tipo"
    };

    const res = await request(app)
      .post("/api/cuidados")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "id_planta_usuario, fecha y tipo son obligatorios" });
  });
});