// Pruebas Unitarias Backend – HU19 Simulación de riego manual
// Escenario P1: Envío exitoso del comando (HTTP 200)

const app = require("../server");

describe("Pruebas Unitarias Backend – HU19 (POST /api/regar)", () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  test("Escenario 1 (P1) – Envío exitoso del comando de riego", async () => {
    const resp = await fetch(`${baseUrl}/api/regar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await resp.json().catch(() => ({}));

    expect(resp.status).toBe(200);
    expect(body).toHaveProperty("message");
    expect(body.message).toBe("Comando de riego enviado");
  });
});