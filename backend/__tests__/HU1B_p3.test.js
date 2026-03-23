const request = require("supertest");
const oracledb = require("oracledb");

jest.mock("oracledb");

describe("HU1 – Backend – Escenario 3 (P3) – Contraseña inválida", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createApp } = require("../app");
    app = createApp();
  });

  test("P3 – POST /api/register debe responder 400 cuando la contraseña tiene menos de 8 caracteres", async () => {
    // Arrange:
    // El flujo pasa la validación de campos y correo,
    // pero debe detenerse por longitud insuficiente de contraseña.
    const payload = {
      id_usuario: 103,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3001234567",
      correo_electronico: "juliana@correo.com",
      contrasena: "1234567"
    };

    // Act:
    const res = await request(app).post("/api/register").send(payload);

    // Assert:
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "La contraseña debe tener al menos 8 caracteres"
    });

    // No debe conectarse a la base de datos.
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});