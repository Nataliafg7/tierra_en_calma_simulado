const request = require("supertest");
const oracledb = require("oracledb");

jest.mock("oracledb");

describe("HU1 – Backend – Escenario 2 (P2) – Correo inválido", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createApp } = require("../app");
    app = createApp();
  });

  test("P2 – POST /api/register debe responder 400 cuando el correo no tiene un formato válido", async () => {
    // Arrange:
    // Se envían todos los campos, pero el correo no cumple el formato esperado.
    const payload = {
      id_usuario: 102,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3001234567",
      correo_electronico: "juliana-correo.com",
      contrasena: "clave1234"
    };

    // Act:
    const res = await request(app).post("/api/register").send(payload);

    // Assert:
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "El correo electrónico no es válido"
    });

    // No debe intentar conexión porque el error ocurre en validación.
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});