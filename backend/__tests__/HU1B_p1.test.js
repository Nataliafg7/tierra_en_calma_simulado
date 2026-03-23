const request = require("supertest");
const oracledb = require("oracledb");

jest.mock("oracledb");

describe("HU1 – Backend – Escenario 1 (P1) – Campos incompletos", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createApp } = require("../app");
    app = createApp();
  });

  test("P1 – POST /api/register debe responder 400 cuando faltan campos obligatorios", async () => {
    // Arrange:
    // En este escenario se envía un cuerpo incompleto.
    // La validación debe detener el flujo antes de intentar conexión con la base de datos.
    const payload = {
      id_usuario: 101,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3001234567",
      correo_electronico: "juliana@correo.com"
      // contrasena ausente
    };

    // Act:
    const res = await request(app).post("/api/register").send(payload);

    // Assert:
    // Se espera un 400 por datos incompletos.
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Todos los campos son obligatorios"
    });

    // Como la validación falló, no debe abrir conexión.
    expect(oracledb.getConnection).not.toHaveBeenCalled();
  });
});