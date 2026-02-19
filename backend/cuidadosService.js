const oracledb = require("oracledb");
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN,
};

/** Obtienemos el último ID_RIEGO asociado a la última lectura del sensor de la planta */
async function getUltimoIdRiegoPorPlantaUsuario(conn, idPlantaUsuario) {
  // 1) Sensor de la planta
  const s = await conn.execute(
    `SELECT ID_SENSOR
       FROM TIERRA_EN_CALMA.SENSORES
      WHERE ID_PLANTA_USUARIO = :id_pu
      FETCH FIRST 1 ROWS ONLY`,
    { id_pu: idPlantaUsuario },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if (!s.rows.length) return null;
  const idSensor = s.rows[0].ID_SENSOR;

  // 2) Última lectura del sensor
  const l = await conn.execute(
    `SELECT ID_LECTURA
       FROM TIERRA_EN_CALMA.LECTURA_SENSORES
      WHERE ID_SENSOR = :id_sensor
      ORDER BY FECHA_HORA DESC
      FETCH FIRST 1 ROWS ONLY`,
    { id_sensor: idSensor },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if (!l.rows.length) return null;
  const idLectura = l.rows[0].ID_LECTURA;

  // 3) Riego asociado a esa lectura, si existe
  const r = await conn.execute(
    `SELECT ID_RIEGO
       FROM TIERRA_EN_CALMA.RIEGO
      WHERE ID_LECTURA = :id_lectura
      ORDER BY FECHA_HORA DESC
      FETCH FIRST 1 ROWS ONLY`,
    { id_lectura: idLectura },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows.length ? r.rows[0].ID_RIEGO : null;
}

async function crearCuidado({ id_planta_usuario, fecha, tipo_cuidado, detalle }) {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    // último riego de esa planta, si existe
    const idRiego = await getUltimoIdRiegoPorPlantaUsuario(conn, id_planta_usuario);

    const result = await conn.execute(
      `
      INSERT INTO TIERRA_EN_CALMA.HISTORIAL_CUIDADOS
        (ID_PLANTA_USUARIO, ID_RIEGO, FECHA, TIPO_CUIDADO, DETALLE)
      VALUES
        (:id_pu, :id_riego, TO_DATE(:fecha,'YYYY-MM-DD'), :tipo_cuidado, :detalle)
      RETURNING ID_CUIDADO INTO :id_out
      `,
      {
        id_pu: id_planta_usuario,
        id_riego: idRiego,                
        fecha,                              
        tipo_cuidado: tipo_cuidado,                
        detalle: detalle || null,
        id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );

    const out = result.outBinds?.id_out;
    const id_cuidado = Array.isArray(out) ? out[0] : out;

    console.log('[CUIDADOS][OK]', {
      id_cuidado,
      id_planta_usuario,
      id_riego: idRiego,
      fecha, 
      rowsAffected: result.rowsAffected,
    });

    return { id_cuidado, id_riego: idRiego };
  } finally {
    if (conn) await conn.close().catch(() => { });
  }
}

module.exports = { crearCuidado };
