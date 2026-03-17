// __tests__/HU18B_p6_assert.test.js
const request = require("supertest");
const app = require("../server");
const { ensureSensor, insertLectura } = require("./helpers/oracleSeed");

jest.setTimeout(60000);

describe("HU18 – Backend – P6 (error en PL/SQL)", () => {
  test("Debe retornar ok:false cuando falla la ejecución PL/SQL (CONTROL_RIEGO)", async () => {
    const idPlantaUsuario = 46; 
    const idSensor = await ensureSensor(idPlantaUsuario);


    await insertLectura({ idSensor, temperatura: 25, humedad: 50 });

    // Ejecuta el endpoint
    const res = await request(app)
      .post("/api/verificar-condiciones")
      .send({ id_planta_usuario: idPlantaUsuario });

    expect(res.status).toBe(200); 
    expect(res.body.ok).toBe(false);
    expect(res.body.mensaje).toContain("Error");
  });
});