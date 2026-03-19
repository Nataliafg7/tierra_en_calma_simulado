const request = require("supertest");
const { createApp } = require("../app"); // ajusta la ruta si tu test está en otra carpeta

describe("HU8 – Backend – Escenario 1 (P1) – Consulta exitosa del banco de especies (GET /api/plantas)", () => {
  let app;

  // Sin mocks: esto depende de que Oracle esté disponible y las variables de entorno estén correctas.
  beforeAll(() => {
    app = createApp();
  });

  // Aumentamos timeout por posible latencia de BD
  jest.setTimeout(30000);

  test("P1.1 – Debe responder HTTP 200 y retornar un arreglo JSON", async () => {
    const res = await request(app).get("/api/plantas");

    expect(res.status).toBe(200);

    // Content-Type suele ser application/json; charset=utf-8
    expect(res.headers["content-type"]).toMatch(/json/);

    // Debe retornar un arreglo (puede ser vacío si la tabla no tiene registros)
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("P1.2 – Cada elemento debe tener ID_PLANTA y NOMBRE_COMUN cuando existan filas", async () => {
    const res = await request(app).get("/api/plantas");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Subprueba solo si hay datos (no asumimos que la tabla tenga filas)
    if (res.body.length > 0) {
      const first = res.body[0];

      expect(first).toHaveProperty("ID_PLANTA");
      expect(first).toHaveProperty("NOMBRE_COMUN");

      // Tipos razonables según SELECT
      expect(first.ID_PLANTA).not.toBeUndefined();
      expect(first.NOMBRE_COMUN).not.toBeUndefined();
    }
  });

  test("P1.3 – La lista debe venir ordenada por NOMBRE_COMUN (ORDER BY del SQL)", async () => {
    const res = await request(app).get("/api/plantas");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Si hay 0 o 1 elemento, por definición está ordenado
    if (res.body.length > 1) {
      const nombres = res.body.map((x) => (x.NOMBRE_COMUN ?? "").toString());

      // Verifica orden ascendente (comparación simple de strings)
      const sorted = [...nombres].sort((a, b) => a.localeCompare(b));
      expect(nombres).toEqual(sorted);
    }
  });
});