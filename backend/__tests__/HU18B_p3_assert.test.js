/**
 * HU18B - P3
 * Camino: B1 → B2(No) → B4 → B5(No) → B7 → B8(Sí) → B9 → B10 → B13 → B14
 * Objetivo: Insertar una lectura real (hum < 40 o temp > 30) y validar riego automático.
 * Nota: En modo test puede no haber MQTT conectado; lo importante es que el flujo NO se caiga.
 */

const request = require("supertest");
const app = require("../server");
const { ensureSensor, insertLectura } = require("./helpers/oracleSeed");

jest.setTimeout(60000);

describe("HU18 – Backend – P3 (riego automático)", () => {
  test("Debe retornar ok:true y mensaje de riego automático", async () => {
    const idPlantaUsuario = 46;
    const idSensor = await ensureSensor(idPlantaUsuario);

    // hum < 40 activa riego 
    await insertLectura({ idSensor, temperatura: 25, humedad: 60 });

    const res = await request(app)
      .post("/api/verificar-condiciones")
      .send({ id_planta_usuario: idPlantaUsuario });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mensaje).toContain("Riego automático activado");
  });
});