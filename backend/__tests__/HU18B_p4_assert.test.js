/**
 * HU18B - P4
 * Camino: B1 → B2(No) → B4 → B5(No) → B7 → B8(No) → B10 → B13 → B14
 * Objetivo: Insertar lectura real con condiciones normales y validar que NO se requiere riego.
 */

const request = require("supertest");
const app = require("../server");
const { ensureSensor, insertLectura } = require("./helpers/oracleSeed");

jest.setTimeout(60000);

describe("HU18 – Backend – P4 (no requiere riego)", () => {
  test("Debe retornar ok:true y mensaje de no riego", async () => {
    const idPlantaUsuario = 46;
    const idSensor = await ensureSensor(idPlantaUsuario);

    // Condición normal: hum >= 40 y temp <= 30
    await insertLectura({ idSensor, temperatura: 25, humedad: 60 });

    const res = await request(app)
      .post("/api/verificar-condiciones")
      .send({ id_planta_usuario: idPlantaUsuario });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mensaje).toContain("No se requirió riego");
  });
});