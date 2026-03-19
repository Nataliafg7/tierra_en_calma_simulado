// backend/__tests__/HU23B_p3.test.js
const request = require("supertest");

function loadApp() {
  try { return require("../server"); } catch (e1) {}
  try { return require("../app"); } catch (e2) {}
  throw new Error("No se pudo cargar el app. Exporta el Express app en server.js o app.js (module.exports = app).");
}

describe("HU23 – Backend – Escenario 3 (P3) – Error interno durante el registro", () => {
  test("P3 – Debe responder 500 cuando la BD/servicio falla", async () => {
    const app = loadApp();

    const detalleLargo = "X".repeat(5000); // fuerza posible ORA-12899 u otro error real

    const payload = {
      id_planta_usuario: 1,
      fecha: "2026-03-04",
      tipo: "riego",
      detalle: detalleLargo
    };

    const res = await request(app)
      .post("/api/cuidados") // ajusta si tu ruta real es otra
      .send(payload);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "No se pudo registrar el cuidado" });
  });
});