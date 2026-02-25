/**
 * ============================================================
 * PRUEBA UNITARIA – HU1 REGISTRO DE USUARIO
 * Escenario 1 (P1): Registro exitoso
 * ============================================================
 *
 * Objetivo:
 * Verificar que cuando la conexión a Oracle, el INSERT y el cierre
 * de conexión se ejecutan correctamente, el endpoint /api/register
 * responde con HTTP 200 y el mensaje de éxito esperado.
 *
 * Tipo de prueba:
 * Prueba unitaria (aislada de servicios externos).
 *
 * Justificación:
 * Para cumplir con el concepto de prueba unitaria, no se utiliza
 * una conexión real a Oracle. En su lugar, se simula (mock)
 * el comportamiento del módulo oracledb para controlar el flujo
 * del escenario exitoso sin depender de infraestructura externa.
 */

const request = require("supertest"); 
// Supertest permite simular una petición HTTP hacia el endpoint
// sin necesidad de levantar el servidor real con app.listen().

// Se crea un mock del módulo oracledb.
// Esto reemplaza temporalmente la implementación real durante la prueba.
// De esta manera, la prueba no depende de la base de datos real.
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");

// Se importa la aplicación Express exportada desde server.js.
// Esto permite probar directamente la lógica del endpoint.
const app = require("../server");


test("P1 - Registro exitoso devuelve 200 y mensaje de éxito", async () => {

  /**
   * Se define una conexión simulada (fakeConn).
   * Esta conexión contiene los métodos que el endpoint utiliza:
   *  - execute(): simula la ejecución exitosa del INSERT.
   *  - close(): simula el cierre correcto de la conexión.
   *
   * mockResolvedValue indica que la promesa se resuelve correctamente.
   */
  const fakeConn = {
    execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
    close: jest.fn().mockResolvedValue(undefined),
  };

  /**
   * Se configura el comportamiento del mock:
   * Cuando el código del endpoint invoque
   * oracledb.getConnection(), devolverá fakeConn.
   */
  oracledb.getConnection.mockResolvedValue(fakeConn);

  /**
   * Se realiza la petición HTTP simulada al endpoint real.
   * Se envía un cuerpo válido que representa un registro correcto.
   */
  const res = await request(app)
    .post("/api/register")
    .send({
      id_usuario: 1,
      nombre: "Juliana",
      apellido: "Flórez",
      telefono: "3000000000",
      correo_electronico: "juliana@test.com",
      contrasena: "12345678",
    });

  /**
   * Validaciones del escenario esperado (P1):
   * 1. El estado HTTP debe ser 200 (éxito).
   * 2. El mensaje de respuesta debe coincidir con el definido en el backend.
   */
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: "Usuario registrado con éxito" });

  /**
   * Validación del flujo interno:
   * Se comprueba que los métodos principales del flujo exitoso
   * fueron ejecutados exactamente una vez.
   */
  expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  expect(fakeConn.execute).toHaveBeenCalledTimes(1);
  expect(fakeConn.close).toHaveBeenCalledTimes(1);
});