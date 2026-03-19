// backend/__tests__/HU23B_p2.test.js
const request = require("supertest");

function loadApp() {
  try { return require("../server"); } catch (e1) {}
  try { return require("../app"); } catch (e2) {}
  throw new Error("No se pudo cargar el app. Exporta el Express app en server.js o app.js (module.exports = app).");
}

describe("HU23 – Backend – Escenario 2 (P2) – Registro exitoso del cuidado", () => {
  test("P2 – Debe responder 201 y retornar id_cuidado e id_riego", async () => {
    const app = loadApp();

    const payload = {
      id_planta_usuario: 1,           // usa un ID real existente en tu BD si quieres que pase
      fecha: "2026-03-04",            // formato esperado YYYY-MM-DD
      tipo: "fertilizacion",          // según tu endpoint (en service se llama tipo_cuidado)
      detalle: "Aplicación de abono"
    };

    const res = await request(app)
      .post("/api/cuidados") // ajusta si tu ruta real es otra
      .send(payload);

    // Si aquí te falla con 500, esa evidencia sirve para mostrar dependencia del entorno/BD
    expect(res.status).toBe(201);

    // Debe retornar llaves esperadas
    expect(res.body).toHaveProperty("id_cuidado");
    expect(res.body).toHaveProperty("id_riego");
  });
});