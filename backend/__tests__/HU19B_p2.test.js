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

  test("Escenario 2 (P2) – Fallo en el envío del comando de riego", async () => {
    const resp = await fetch(`${baseUrl}/api/regar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await resp.json().catch(() => ({}));

    expect(resp.status).toBe(500);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("No se pudo enviar el comando");
  });
});