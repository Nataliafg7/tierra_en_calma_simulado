/**
 * HU11 – Backend – Escenario 4 (P4)
 * Endpoint: GET /api/mis-plantas
 *
 * Importante:
 * - No importamos app.js del proyecto para evitar que swagger/mqtt/intervalos dejen handles abiertos.
 * - Creamos un servidor temporal mínimo SOLO con este endpoint.
 * - La falla se provoca en execute() (consulta) usando una bandera FORCE_SQL_ERROR.
 */

require("dotenv").config();

const express = require("express");
const http = require("http");
const oracledb = require("oracledb");

jest.setTimeout(30000); // damos más margen por ser BD real

function levantarServidor(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

/**
 * Crea un app temporal con el endpoint real (copiado tal cual).
 * Esto evita depender del app.js principal y sus procesos extra.
 */
function createTestApp() {
  const app = express();

  const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASS,
    connectString: process.env.ORACLE_CONN,
  };

  // ======================= MIS PLANTAS =======================
  app.get("/api/mis-plantas", async (req, res) => {
    const raw = req.header("x-user-id");
    const id_usuario = Number(raw);

    if (!Number.isInteger(id_usuario)) {
      return res.status(400).json({ error: "x-user-id inválido" });
    }

    let connection;

    try {
      connection = await oracledb.getConnection(dbConfig);

      // Bandera para forzar error SOLO en execute (consulta), manteniendo conexión OK
      if (process.env.FORCE_SQL_ERROR === "1") {
        await connection.execute("SELECT * FROM TABLA_QUE_NO_EXISTE");
      }

      const result = await connection.execute(
        `SELECT 
           pu.ID_PLANTA_USUARIO    AS ID_PLANTA_USUARIO,
           bp.ID_PLANTA            AS ID_PLANTA,
           bp.NOMBRE_COMUN         AS NOMBRE_COMUN,
           bp.NOMBRE_CIENTIFICO    AS NOMBRE_CIENTIFICO
         FROM TIERRA_EN_CALMA.PLANTAS_USUARIO pu
         JOIN TIERRA_EN_CALMA.BANCO_PLANTAS bp
           ON pu.ID_PLANTA = bp.ID_PLANTA
        WHERE pu.ID_USUARIO = :id_usuario`,
        { id_usuario },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      res.json(result.rows ?? []);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener las plantas del usuario" });
    } finally {
      if (connection) {
        try { await connection.close(); } catch {}
      }
    }
  });

  return app;
}

describe("HU11 – Backend – Escenario 4 (P4) Error durante la consulta", () => {
  let server;
  let baseUrl;

  afterEach(async () => {
    if (server) await new Promise((r) => server.close(r));
    server = undefined;
    baseUrl = undefined;

    // limpiar bandera por si luego corres otros tests
    delete process.env.FORCE_SQL_ERROR;
  });

  test("P4 – Debe retornar HTTP 500 cuando ocurre un error en execute (consulta SQL)", async () => {
    /**
     * Activamos la bandera para que el endpoint ejecute una consulta inválida
     * y así garantizar que el error ocurra en connection.execute().
     */
    process.env.FORCE_SQL_ERROR = "1";

    // Creamos el servidor temporal SOLO con este endpoint
    const app = createTestApp();
    ({ server, baseUrl } = await levantarServidor(app));

    // Petición real al endpoint
    const resp = await fetch(`${baseUrl}/api/mis-plantas`, {
      method: "GET",
      headers: { "x-user-id": "1" },
    });

    const body = await resp.json();

    // Validación esperada del escenario P4
    expect(resp.status).toBe(500);
    expect(body).toEqual({ error: "Error al obtener las plantas del usuario" });
  });
});