/**
 * PRUEBAS DE SEGURIDAD - BACKEND
 *
 * Historias evaluadas:
 * HU1  - Registro de usuario
 * HU3  - Inicio de sesión
 * HU8  - Consulta del banco de especies
 * HU10 - Asociación de plantas a un usuario
 * HU11 - Visualización de plantas registradas
 *
 * Objetivo:
 * Validar que el sistema controle correctamente entradas inválidas,
 * evite operaciones incompletas y restrinja accesos sin identificación.
 *
 * Enfoque:
 * Se prueban escenarios donde el usuario envía datos incorrectos,
 * incompletos o intenta acceder sin autenticación.
 */

const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

/**
 * Se reemplaza OracleDB para evitar conexión real.
 * Permite controlar manualmente las respuestas de la base de datos.
 */
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

/**
 * Se aíslan servicios externos para que no interfieran en la validación.
 */
jest.mock("../mqttService", () => ({}));
jest.mock("../cuidadosService", () => ({ crearCuidado: jest.fn() }));
jest.mock("../pkgCentralService", () => ({ verificarCondiciones: jest.fn() }));

/**
 * Se evita el envío real de correos durante las pruebas.
 */
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

/**
 * Se evita que Swagger genere errores al iniciar la aplicación.
 */
jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));

jest.mock("yamljs", () => ({
  load: jest.fn(() => ({})),
}));

describe("Seguridad backend - HU1, HU3, HU8, HU10 y HU11", () => {
  let app;
  let connectionMock;

  /**
   * Antes de cada prueba:
   * - Se reinician los mocks
   * - Se crea una instancia nueva de la app
   * - Se simula la conexión a la base de datos
   */
  beforeEach(() => {
    jest.clearAllMocks();

    app = createApp();

    connectionMock = {
      execute: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      close: jest.fn(),
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
  });

  test("HU1 - rechaza registro con campos obligatorios faltantes", async () => {
    /**
     * Se omiten campos obligatorios como id_usuario, apellido y telefono.
     * El backend debe impedir el registro y responder con error 400.
     */
    const response = await request(app)
      .post("/api/register")
      .send({
        nombre: "Juliana",
        correo_electronico: "juliana@test.com",
        contrasena: "12345678",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Todos los campos son obligatorios");
  });

  test("HU1 - rechaza registro con correo mal formado", async () => {
    /**
     * Se envía un correo sin formato válido (sin '@').
     * El sistema debe detectar la estructura incorrecta.
     */
    const response = await request(app)
      .post("/api/register")
      .send({
        id_usuario: 1,
        nombre: "Juliana",
        apellido: "Florez",
        telefono: "3001234567",
        correo_electronico: "juliana test.com",
        contrasena: "12345678",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("El correo electrónico no es válido");
  });

  test("HU1 - rechaza registro con contraseña corta", async () => {
    /**
     * Se envía una contraseña menor a 8 caracteres.
     * El sistema debe rechazarla por no cumplir la política mínima.
     */
    const response = await request(app)
      .post("/api/register")
      .send({
        id_usuario: 1,
        nombre: "Juliana",
        apellido: "Florez",
        telefono: "3001234567",
        correo_electronico: "juliana@test.com",
        contrasena: "123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("La contraseña debe tener al menos 8 caracteres");
  });

  test("HU3 - rechaza login sin datos obligatorios", async () => {
    /**
     * Se omite el correo electrónico.
     * El sistema debe impedir el acceso por falta de datos.
     */
    const response = await request(app)
      .post("/api/login")
      .send({
        contrasena: "12345678",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("El correo y la contraseña son obligatorios");
  });

  test("HU3 - rechaza login con credenciales incorrectas", async () => {
    /**
     * Se simula que la base de datos no encuentra coincidencias.
     * El sistema debe responder con error de autenticación.
     */
    connectionMock.execute.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app)
      .post("/api/login")
      .send({
        correo_electronico: "incorrecto@test.com",
        contrasena: "12345678",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciales inválidas");
  });

  test("HU8 - permite consulta de especies sin exponer errores", async () => {
    /**
     * Se valida que la consulta pública no falle ni exponga errores internos.
     */
    connectionMock.execute.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app).get("/api/plantas");

    expect(response.status).toBe(200);
  });

  test("HU10 - rechaza registro de planta sin id_usuario", async () => {
    /**
     * Se intenta registrar una planta sin identificar al usuario.
     * El sistema debe bloquear la operación.
     */
    const response = await request(app)
      .post("/api/registrar-planta")
      .send({
        id_planta: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Datos incompletos para registrar la planta");
  });

  test("HU10 - rechaza registro de planta sin id_planta", async () => {
    /**
     * Se omite el id de la planta.
     * El sistema no debe permitir la inserción.
     */
    const response = await request(app)
      .post("/api/registrar-planta")
      .send({
        id_usuario: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Datos incompletos para registrar la planta");
  });

  test("HU11 - rechaza consulta sin header x-user-id", async () => {
    /**
     * Se intenta acceder a datos del usuario sin identificarse.
     * El sistema debe exigir el header x-user-id.
     */
    const response = await request(app).get("/api/mis-plantas");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("x-user-id inválido");
  });

  test("HU11 - rechaza consulta con header inválido", async () => {
    /**
     * Se envía un identificador no numérico.
     * El sistema debe validar el tipo de dato.
     */
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "abc");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("x-user-id inválido");
  });
});