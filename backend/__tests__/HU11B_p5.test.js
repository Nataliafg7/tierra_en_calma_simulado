// backend/__tests__/HU11B_p5.test.js

const http = require("http");

// AJUSTA estas rutas según tu proyecto:
const oracledb = require("oracledb");
const { createApp } = require("../app"); // o donde tengas tu createApp()

// Helper: levantar servidor en puerto libre
function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

describe("HU11 – Backend – Escenario 5 (P5) – Flujo exitoso aunque falle el cierre", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    const port = await listen(server);
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((r) => server.close(r));
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Debe responder 200 aunque falle el cierre de conexión (P5)", async () => {
    // 1) Mock controlado de conexión: execute OK, close falla
    const fakeRows = [
      { ID_PLANTA_USUARIO: 1, ID_PLANTA: 10, NOMBRE_COMUN: "Monstera", NOMBRE_CIENTIFICO: "Monstera deliciosa" },
    ];

    const closeMock = jest.fn().mockRejectedValue(new Error("close failed"));
    const executeMock = jest.fn().mockResolvedValue({ rows: fakeRows });

    jest.spyOn(oracledb, "getConnection").mockResolvedValue({
      execute: executeMock,
      close: closeMock,
    });

    // (Opcional) si tu backend imprime error al cerrar, puedes capturar consola
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // 2) Ejecutar request real
    const response = await fetch(baseUrl + "/api/mis-plantas", {
      method: "GET",
      headers: { "x-user-id": "1" },
    });

    // 3) Assertions principales (sin mocks de HTTP, solo mock de DB)
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].NOMBRE_COMUN).toBe("Monstera");

    // 4) Verificar que se intentó ejecutar query y cerrar
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);

    // 5) Si el server registra el error del cierre, validar que hubo log (opcional)
    // Si tu código NO hace console.error al fallar close, elimina esta aserción.
    // expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  }, 30000); // aumenta timeout por si Oracle/express tarda en entorno de pruebas
});