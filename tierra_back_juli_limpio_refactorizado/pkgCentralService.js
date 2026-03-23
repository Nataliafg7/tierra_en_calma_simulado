// paquete para verificar condiciones desde oracle
const oracledb = require("oracledb");
const mqttService = require("./mqttService");

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN,
};

async function verificarCondiciones(idPlantaUsuario) {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    // Obtenemos la última lectura
    const lectura = await conn.execute(
      `SELECT TEMPERATURA, HUMEDAD
         FROM TIERRA_EN_CALMA.LECTURA_SENSORES L
         JOIN TIERRA_EN_CALMA.SENSORES S ON L.ID_SENSOR = S.ID_SENSOR
        WHERE S.ID_PLANTA_USUARIO = :id_pu
        ORDER BY FECHA_HORA DESC
        FETCH FIRST 1 ROWS ONLY`,
      { id_pu: idPlantaUsuario },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!lectura.rows.length) {
      return { ok: false, mensaje: "No hay lecturas registradas para esta planta." };
    }

    const { TEMPERATURA, HUMEDAD } = lectura.rows[0];

    // Ejecutar el procedimiento de la bd y capturar el mensaje de salida
    const result = await conn.execute(
      `DECLARE 
         v_msg VARCHAR2(100);
       BEGIN
         PKG_CENTRAL.CONTROL_RIEGO(:id_pu, :temp, :hum);
         v_msg := CASE
                    WHEN :hum < 40 OR :temp > 30 THEN 
                      'Riego automático activado'
                    ELSE 
                      'No se requirió riego'
                  END;
         :out_msg := v_msg;
       END;`,
      {
        id_pu: idPlantaUsuario,
        temp: TEMPERATURA,
        hum: HUMEDAD,
        out_msg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 }
      },
      { autoCommit: true }
    );

    const mensaje = result.outBinds.out_msg;
  
    if (mensaje.includes("Riego automático")) {
      console.log(`[PKG_CENTRAL] Activando riego físico via MQTT...`);
      await mqttService.enviarComandoFisicoRiego(); 
    }
    return {
      ok: true,
      mensaje: `${mensaje}. Última lectura: ${TEMPERATURA}°C / ${HUMEDAD}%.`
    };

  } catch (err) {
    console.error("[PKG_CENTRAL] Error:", err.message);
    return { ok: false, mensaje: "Error al ejecutar la verificación." };
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
}


module.exports = { verificarCondiciones };
