const request = require("supertest");

// Se reemplaza el módulo real de Oracle por un mock
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const app = require("../server");

describe("HU1 - Registro de usuario", () => {

  // Antes de cada prueba se limpian los mocks
  // Esto evita que una prueba afecte a otra
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P1 - Registro exitoso devuelve 200 y mensaje de éxito", async () => {

    // =========================
    // Arrange (preparar datos)
    // =========================

    // Se simula una conexión a base de datos
    // execute simula el INSERT exitoso
    // close simula el cierre correcto de la conexión
    const fakeConn = {
      execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Datos válidos de entrada
    const nuevoUsuario = {
      id_usuario: 1,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3000000000",
      correo_electronico: "juliana.casas@gmail.com",
      contrasena: "12345678",
    };

    // Cuando el endpoint llame a getConnection,
    // se devuelve la conexión simulada
    oracledb.getConnection.mockResolvedValue(fakeConn);

    // =========================
    // Act (ejecutar)
    // =========================

    const res = await request(app)
      .post("/api/register")
      .send(nuevoUsuario);

    // =========================
    // Assert (validar)
    // =========================

    // Se valida respuesta HTTP
    expect(res.status).toBe(200);

    // Se valida mensaje de éxito
    expect(res.body).toEqual({
      message: "Usuario registrado con éxito"
    });

    // Se valida que el flujo interno se ejecutó
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(fakeConn.execute).toHaveBeenCalledTimes(1);
    expect(fakeConn.close).toHaveBeenCalledTimes(1);
  });

});