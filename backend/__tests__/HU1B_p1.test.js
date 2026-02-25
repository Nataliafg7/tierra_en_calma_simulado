const request = require("supertest"); // Para simular una petición HTTP a Express

// Mock: reemplaza oracledb real por uno falso controlado por la prueba
// ¿Por qué? Porque es prueba unitaria: no dependemos de Oracle real.
jest.mock("oracledb", () => ({
  getConnection: jest.fn()
}));

const oracledb = require("oracledb");
const app = require("../server"); // Importa tu app Express (server.js exporta app)

test("P1 - Registro exitoso devuelve 200 y mensaje de éxito", async () => {
  // Conexión falsa: simula lo que Oracle devuelve cuando todo sale bien
  // ¿Por qué? Tu endpoint usa connection.execute() y connection.close().
  const fakeConn = {
    execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }), // INSERT OK
    close: jest.fn().mockResolvedValue(undefined),             // close OK
  };

  // Cuando el código llame oracledb.getConnection(), le devolvemos nuestra conexión falsa
  oracledb.getConnection.mockResolvedValue(fakeConn);

  // Hacemos la petición al endpoint real (sin levantar el servidor)
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

  // Verificamos el resultado esperado del escenario 1
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: "Usuario registrado con éxito" });

  // Verificamos que el flujo feliz sí se ejecutó
  expect(oracledb.getConnection).toHaveBeenCalledTimes(1);
  expect(fakeConn.execute).toHaveBeenCalledTimes(1);
  expect(fakeConn.close).toHaveBeenCalledTimes(1);
});