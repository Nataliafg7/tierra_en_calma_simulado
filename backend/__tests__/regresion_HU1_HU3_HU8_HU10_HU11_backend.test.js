/**
 * PRUEBAS DE REGRESIÓN - BACKEND
 *
 * Historias evaluadas:
 * HU1  - Registro de usuario
 * HU3  - Inicio de sesión
 * HU8  - Consulta del banco de especies
 * HU10 - Asociación de plantas a un usuario
 * HU11 - Visualización de plantas registradas
 *
 * Propósito:
 * Comprobar que las funcionalidades principales del backend
 * continúan funcionando después de cambios en el código.
 */

const request = require("supertest");
const oracledb = require("oracledb");
const { createApp } = require("../app");

/**
 * Reemplaza OracleDB para evitar conexión real a la base de datos.
 */
jest.mock("oracledb", () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 1,
}));

/**
 * Reemplaza servicios externos para aislar las rutas evaluadas.
 */
jest.mock("../mqttService", () => ({}));
jest.mock("../cuidadosService", () => ({ crearCuidado: jest.fn() }));
jest.mock("../pkgCentralService", () => ({ verificarCondiciones: jest.fn() }));

/**
 * Evita envío real de correos durante las pruebas.
 */
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

/**
 * Evita errores al cargar Swagger en entorno de prueba.
 */
jest.mock("swagger-ui-express", () => ({
  serve: [],
  setup: () => (req, res, next) => next(),
}));

jest.mock("yamljs", () => ({
  load: jest.fn(() => ({})),
}));

describe("Regresión backend - HU1, HU3, HU8, HU10 y HU11", () => {
  let app;
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();

    app = createApp();

    /**
     * Simula una conexión OracleDB con los métodos usados por app.js.
     */
    connectionMock = {
      execute: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      close: jest.fn(),
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
  });

  test("HU1 - registra un usuario correctamente", async () => {
    /**
     * Arrange:
     * Se simula que el INSERT del usuario se ejecuta correctamente.
     */
    connectionMock.execute.mockResolvedValueOnce({
      rowsAffected: 1,
    });

    /**
     * Act:
     * Se envían todos los campos obligatorios exigidos por /api/register.
     */
    const response = await request(app)
      .post("/api/register")
      .send({
        id_usuario: 1,
        nombre: "Juliana",
        apellido: "Florez",
        telefono: "3001234567",
        correo_electronico: "juliana@test.com",
        contrasena: "12345678",
      });

    /**
     * Assert:
     * El registro debe responder exitosamente.
     */
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Usuario registrado con éxito");
  });

  test("HU3 - permite iniciar sesión con credenciales válidas", async () => {
    /**
     * Arrange:
     * Se simula un usuario existente en la base de datos.
     */
    connectionMock.execute.mockResolvedValueOnce({
      rows: [
        {
          ID_USUARIO: 1,
          NOMBRE: "Juliana",
          APELLIDO: "Florez",
          TELEFONO: "3001234567",
          CORREO_ELECTRONICO: "juliana@test.com",
        },
      ],
    });

    /**
     * Act:
     * Se envían los nombres reales de campos usados por /api/login.
     */
    const response = await request(app)
      .post("/api/login")
      .send({
        correo_electronico: "juliana@test.com",
        contrasena: "12345678",
      });

    /**
     * Assert:
     * El login debe retornar mensaje, usuario y rol.
     */
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login exitoso");
    expect(response.body.role).toBe("user");
    expect(response.body.user).toBeDefined();
  });

  test("HU8 - consulta el banco de especies vegetales", async () => {
    /**
     * Arrange:
     * Se simula la lista de plantas retornada por OracleDB.
     */
    connectionMock.execute.mockResolvedValueOnce({
      rows: [
        {
          ID_PLANTA: 1,
          NOMBRE_COMUN: "Lavanda",
          NOMBRE_CIENTIFICO: "Lavandula",
          DESCRIPCION: "Planta aromática",
        },
      ],
    });

    /**
     * Act:
     * Se consulta la ruta real del banco de especies.
     */
    const response = await request(app).get("/api/plantas");

    /**
     * Assert:
     * La consulta debe responder correctamente.
     */
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  test("HU10 - asocia una planta a un usuario", async () => {
    /**
     * Arrange:
     * Se simula que el INSERT de la planta asociada se ejecuta correctamente.
     */
    connectionMock.execute.mockResolvedValueOnce({
      rowsAffected: 1,
    });

    /**
     * Act:
     * Se envían los campos reales exigidos por /api/registrar-planta.
     */
    const response = await request(app)
      .post("/api/registrar-planta")
      .send({
        id_usuario: 1,
        id_planta: 1,
      });

    /**
     * Assert:
     * La asociación debe responder exitosamente.
     */
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Planta registrada con éxito en tu jardín");
  });

  test("HU11 - consulta las plantas registradas de un usuario", async () => {
    /**
     * Arrange:
     * Se simula una planta registrada para el usuario.
     */
    connectionMock.execute.mockResolvedValueOnce({
      rows: [
        {
          ID_PLANTA_USUARIO: 1,
          ID_PLANTA: 1,
          NOMBRE_COMUN: "Lavanda",
          NOMBRE_CIENTIFICO: "Lavandula",
        },
      ],
    });

    /**
     * Act:
     * La ruta /api/mis-plantas recibe el usuario por header x-user-id.
     */
    const response = await request(app)
      .get("/api/mis-plantas")
      .set("x-user-id", "1");

    /**
     * Assert:
     * La consulta debe responder con una lista de plantas.
     */
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});