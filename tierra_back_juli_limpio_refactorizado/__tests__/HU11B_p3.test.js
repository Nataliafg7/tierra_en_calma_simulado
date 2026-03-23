/**
 * HU11 - Backend - GET /api/mis-plantas
 * Escenario 3 (P3): Error al conectar a Oracle
 *
 * Esta prueba verifica que el endpoint responda correctamente cuando ocurre
 * un error al intentar establecer la conexión con la base de datos Oracle.
 * Para provocar este escenario se intercepta el método getConnection()
 * y se fuerza a que lance una excepción.
 */

const oracledb = require("oracledb"); // Se importa el driver de Oracle para interceptar la conexión
const { createApp } = require("../app"); // Se importa la función que construye la aplicación Express

describe("Pruebas Unitarias Backend – HU11 /api/mis-plantas – Escenario P3", () => {

  let server;
  let baseUrl;

  beforeAll(() => {

    // Se intercepta la función getConnection para simular un fallo de conexión a Oracle
    jest.spyOn(oracledb, "getConnection").mockRejectedValue(
      new Error("Error de conexión a Oracle")
    );

    // Se crea una instancia de la aplicación
    const app = createApp();

    // Se levanta un servidor temporal en un puerto disponible
    server = app.listen(0);

    // Se obtiene el puerto asignado automáticamente
    const port = server.address().port;

    // Se construye la URL base que se utilizará en las peticiones
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {

    // Se cierra el servidor temporal al finalizar las pruebas
    server.close();

    // Se restauran las funciones interceptadas para evitar efectos en otras pruebas
    jest.restoreAllMocks();
  });


  test("P3 – Error en la conexión a Oracle", async () => {

    // Se realiza una petición GET al endpoint enviando un identificador válido
    const res = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "9" }
    });

    // Se obtiene el cuerpo de la respuesta en formato JSON
    const body = await res.json();

    // Se verifica que el endpoint responda con código HTTP 500
    expect(res.status).toBe(500);

    // Se verifica que el mensaje de error corresponda al definido en el bloque catch
    expect(body).toEqual({
      error: "Error al obtener las plantas del usuario"
    });

  });

});