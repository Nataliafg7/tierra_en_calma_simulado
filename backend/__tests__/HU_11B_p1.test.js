const request = require("supertest");

jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

jest.mock("../mqttService", () => ({}));
jest.mock("../cuidadosService", () => ({ crearCuidado: jest.fn() }));
jest.mock("../pkgCentralService", () => ({ verificarCondiciones: jest.fn() }));
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));
jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));
jest.mock("yamljs", () => ({
  load: jest.fn(() => ({})),
}));

const oracledb = require("oracledb");
const { createApp } = require("../app");

describe("HU11B P1 - GET /api/mis-plantas con header inválido", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
    app = createApp();
  });

  test("Debe responder 400 y no consultar la base de datos cuando x-user-id no es entero", async () => {
    // ===================== ARRANGE =====================
    // Se prepara una petición con un header inválido
    // FIRST: no se usa Oracle real y no debería intentarse conexión
    const headerInvalido = "abc";

    // ======================= ACT =======================
    // Se ejecuta el endpoint con un x-user-id que no puede convertirse a entero
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", headerInvalido);

    // ===================== ASSERT ======================
    expect(response.status).toBe(400);
    // Fluent assertion: valida que el endpoint rechaza el header inválido

    expect(response.body).toMatchObject({
      error: "x-user-id inválido",
    });
    // Fluent assertion: valida el mensaje de error esperado

    expect(response.body).toHaveProperty("error");
    // Fluent assertion: confirma que la respuesta contiene la propiedad error

    expect(oracledb.getConnection).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no se consulta la BD cuando el header es inválido

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});