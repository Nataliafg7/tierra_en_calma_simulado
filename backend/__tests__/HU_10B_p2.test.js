const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

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

describe("HU10B P2 - POST /api/registrar-planta", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks(); // FIRST: evita contaminación entre pruebas
    app = createApp();
  });

  test("Debe responder 400 cuando faltan datos y no debe acceder a la base de datos", async () => {
    // ===================== ARRANGE =====================
    // Se prepara una solicitud incompleta (faltan datos obligatorios)
    // FIRST: no se usa Oracle real, y no debería intentarse conexión
    const body = {
      id_usuario: 10,
    };

    // ======================= ACT =======================
    // Se ejecuta el endpoint con datos inválidos
    const response = await request(app)
      .post("/api/registrar-planta")
      .send(body);

    // ===================== ASSERT ======================
    expect(response.status).toBe(400);
    // Fluent assertion: valida que el endpoint responde con error de validación

    expect(response.body).toMatchObject({
      error: "Datos incompletos para registrar la planta",
    });
    // Fluent assertion: valida el mensaje de error sin depender de estructura extra

    expect(response.body).toHaveProperty("error");
    // Fluent assertion: asegura que la propiedad error existe en la respuesta

    expect(oracledb.getConnection).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no se accede a la BD cuando falla la validación

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});