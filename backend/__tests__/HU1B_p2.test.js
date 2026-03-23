const request = require("supertest");

// Se reemplaza el módulo real de Oracle por un mock
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const app = require("../server");

describe("HU1 - Registro de usuario - Error de conexión", () => {
  // Se limpian los mocks antes de cada prueba
  // para evitar que una ejecución afecte a otra
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("P2 - Debe retornar 500 cuando falla la conexión a Oracle", async () => {
    // =========================
    // Arrange (preparar datos)
    // =========================

    // Se simula el fallo al intentar conectarse a Oracle
    const errorConexion = new Error("Fallo de conexión a Oracle");
    oracledb.getConnection.mockRejectedValue(errorConexion);

    // Se envían datos válidos para que el error probado
    // sea únicamente el de conexión y no otro del request
    const nuevoUsuario = {
      id_usuario: 1,
      nombre: "Juliana",
      apellido: "Casas",
      telefono: "3000000000",
      correo_electronico: "juliana.casas@gmail.com",
      contrasena: "12345678",
    };

    // =========================
    // Act (ejecutar)
    // =========================

    const response = await request(app)
      .post("/api/register")
      .send(nuevoUsuario);

    // =========================
    // Assert (validar)
    // =========================

    // Se verifica que el endpoint responda con error interno
    expect(response.status).toBe(500);

    // Se valida el mensaje definido por el backend
    expect(response.body).toHaveProperty("error", "Error al registrar usuario");

    // Se confirma que sí se intentó abrir conexión
    expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  });
});