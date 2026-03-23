const request = require("supertest");
const oracledb = require("oracledb");

jest.mock("oracledb");

describe("HU1 – Backend – Escenario 4 (P4) – Registro exitoso con cierre correcto", () => {
  let app;
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();

    connectionMock = {
      execute: jest.fn(),
      close: jest.fn()
    };

    oracledb.getConnection.mockResolvedValue(connectionMock);
    connectionMock.execute.mockResolvedValue({ rowsAffected: 1 });
    connectionMock.close.mockResolvedValue();

    const { createApp } = require("../app");
    app = createApp();
  });

  test("P4 – POST /api/register debe responder 200 cuando el registro se realiza correctamente", async () => {
    // Arrange:
    // Se prepara un mock de módulo para oracledb,
    // un jest.fn para execute y close,
    // y una implementación exitosa para todo el flujo.
    const payload = {
      id_usuario: 104,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3001234567",
      correo_electronico: "juliana@correo.com",
      contrasena: "clave1234"
    };

    // Act:
    const res = await request(app).post("/api/register").send(payload);

    // Assert:
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Usuario registrado con éxito"
    });

    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
    expect(connectionMock.execute).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);

    expect(connectionMock.execute).toHaveBeenCalledWith(
      `INSERT INTO TIERRA_EN_CALMA.USUARIOS 
       (ID_USUARIO, NOMBRE, APELLIDO, TELEFONO, CORREO_ELECTRONICO, CONTRASENA)
       VALUES (:id_usuario, :nombre, :apellido, :telefono, :correo_electronico, :contrasena)`,
      {
        id_usuario: 104,
        nombre: "Juliana",
        apellido: "Flórez",
        telefono: "3001234567",
        correo_electronico: "juliana@correo.com",
        contrasena: "clave1234"
      },
      { autoCommit: true }
    );
  });
});