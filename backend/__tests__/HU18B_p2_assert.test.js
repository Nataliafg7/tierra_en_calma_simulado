/**
 * HU18B - P2
 * Camino: B1 → B2(No) → B4 → B5(Sí: no hay lecturas) → B6 → B13 → B14
 * Objetivo: Validar que si no hay lecturas, el servicio retorna ok:false con mensaje.
 */

const request = require("supertest");
const app = require("../server");

describe("HU18 – Backend – P2 (sin lecturas)", () => {
  test("Debe responder ok:false cuando no existen lecturas para la planta", async () => {
    const idPlantaUsuario = -10; // id que no existe en la BD

    const res = await request(app)
      .post("/api/verificar-condiciones")
      .send({ id_planta_usuario: idPlantaUsuario });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.mensaje).toBe("No hay lecturas registradas para esta planta.");
  });
});