// backend/__tests__/helpers/oracleSeed.js
const oracledb = require("oracledb");

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN,
};

async function ensureSensor(idPlantaUsuario) {
  const conn = await oracledb.getConnection(dbConfig);
  try {
    // 1) buscar sensor existente
    const q = await conn.execute(
      `SELECT ID_SENSOR
         FROM TIERRA_EN_CALMA.SENSORES
        WHERE ID_PLANTA_USUARIO = :id_pu
        FETCH FIRST 1 ROWS ONLY`,
      { id_pu: idPlantaUsuario },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (q.rows.length) return q.rows[0].ID_SENSOR;


    const ins = await conn.execute(
    `INSERT INTO TIERRA_EN_CALMA.SENSORES
    (ID_PLANTA_USUARIO, TIPO_SENSOR)
    VALUES (:id_pu, 'DHT11')
    RETURNING ID_SENSOR INTO :out_id`,
    {
        id_pu: idPlantaUsuario,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: true }
    );

    const out = ins.outBinds?.out_id;
    return Array.isArray(out) ? out[0] : out;
  } finally {
    await conn.close().catch(() => {});
  }
}

async function insertLectura({ idSensor, temperatura, humedad }) {
  const conn = await oracledb.getConnection(dbConfig);
  try {
    const r = await conn.execute(
      `INSERT INTO TIERRA_EN_CALMA.LECTURA_SENSORES
        (ID_SENSOR, TEMPERATURA, HUMEDAD, FECHA_HORA)
       VALUES
        (:id_sensor, :temp, :hum, SYSTIMESTAMP)
       RETURNING ID_LECTURA INTO :out_id`,
      {
        id_sensor: idSensor,
        temp: temperatura,
        hum: humedad,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );

    const out = r.outBinds?.out_id;
    return Array.isArray(out) ? out[0] : out;
  } finally {
    await conn.close().catch(() => {});
  }
}

module.exports = { ensureSensor, insertLectura };