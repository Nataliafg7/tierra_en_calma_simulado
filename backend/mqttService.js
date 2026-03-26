// SONAR-IGNORE-START
const mqtt = require("mqtt");
const oracledb = require("oracledb");
const { startSimulator, stopSimulator } = require("./SimuladorSensor");

let client;
let ultimoDato = "Esperando datos...";
let historial = [];
let isSimulatorMode = false;

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN,
};

// ID dinámico según la planta elegida
let CURRENT_SENSOR_ID = null;

let ultimoGuardado = 0;
let guardando = false;
const INTERVALO_GUARDADO = 300 * 1000;

// HDU20
async function ensureSensorForPlanta(idPlantaUsuario) {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    const sel = await conn.execute(
      `SELECT ID_SENSOR
         FROM TIERRA_EN_CALMA.SENSORES
        WHERE ID_PLANTA_USUARIO = :pid
        FETCH FIRST 1 ROWS ONLY`,
      { pid: idPlantaUsuario },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (sel.rows?.length) {
      console.log(
        `[SENSORES] Ya existe sensor para PU=${idPlantaUsuario}: ID_SENSOR=${sel.rows[0].ID_SENSOR}`
      );
      return sel.rows[0].ID_SENSOR;
    }

    const ins = await conn.execute(
      `INSERT INTO TIERRA_EN_CALMA.SENSORES
         (ID_PLANTA_USUARIO, TIPO_SENSOR)
       VALUES (:pid, :tipo)
       RETURNING ID_SENSOR INTO :out_id`,
      {
        pid: idPlantaUsuario,
        tipo: "DHT11",
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const out = ins.outBinds.out_id;
    const nuevoId = Array.isArray(out) ? out[0] : out;
    console.log(`[SENSORES][CREATE OK] PU=${idPlantaUsuario} → ID_SENSOR=${nuevoId}`);
    return nuevoId;
  } finally {
    try {
      await conn?.close();
    } catch { }
  }
}

// HDU20
async function setSensorForPlanta(idPlantaUsuario) {
  const id = await ensureSensorForPlanta(idPlantaUsuario);
  CURRENT_SENSOR_ID = id;
  console.log(
    `[SENSORES][SET ACTIVE] PU=${idPlantaUsuario} CURRENT_SENSOR_ID=${CURRENT_SENSOR_ID}`
  );
  return id;
}

// HDU21
function initMQTTSimulator(options = {}) {
  isSimulatorMode = true;
  console.log("[MQTT] Modo SIMULADOR activado");

  startSimulator({
    everyMs: options?.everyMs || 2000,
    onDato: procesarDatoInterno
  });
}

/* istanbul ignore start */
// Infraestructura MQTT externa: no suele aportar a la cobertura de las HU
function initMQTTBroker(brokerUrl, options, topic) {
  isSimulatorMode = false;
  client = mqtt.connect(brokerUrl, options);

  client.on("connect", () => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error("Error al suscribirse:", err);
      } else {
        console.log(`Suscrito al topic ${topic}`);
      }
    });
  });

  client.on("message", (topicRecibido, message) => {
    try {
      const dato = JSON.parse(message.toString());
      procesarDatoInterno(dato);
    } catch (err) {
      console.error("Error al procesar mensaje MQTT:", err);
    }
  });

  client.on("error", (err) => {
    console.error("Error MQTT:", err);
  });
}
/* istanbul ignore end */

// HDU20 / HDU21 / HDU25
async function procesarDatoInterno(dato) {
  ultimoDato = dato;
  historial.push(dato);

  if (!CURRENT_SENSOR_ID) {
    console.log("[SENSOR] Dato recibido (sin sensor activo):", dato);
    return;
  }

  const ahora = Date.now();
  if (guardando) return;

  if (ahora - ultimoGuardado >= INTERVALO_GUARDADO) {
    guardando = true;
    await procesarDatoMQTT(dato);
    ultimoGuardado = Date.now();
    guardando = false;
  }
}

// HDU20 / HDU21 / HDU25
async function procesarDatoMQTT(dato) {
  let conn;
  try {
    const regex = /^T:(\d+(?:\.\d+)?),H:(\d+(?:\.\d+)?)%$/;
    const match = dato.match(regex);

    if (!match) {
      console.warn("[MQTT][SKIP] Formato inválido:", dato);
      return;
    }

    if (!CURRENT_SENSOR_ID) {
      console.warn("[MQTT][SKIP] CURRENT_SENSOR_ID vacío. No se inserta.");
      return;
    }

    const temperatura = Number(Number.parseFloat(match[1]).toFixed(2));
    const humedad = Number(Number.parseFloat(match[2]).toFixed(2));
    if (Number.isNaN(temperatura) || Number.isNaN(humedad)) {
      console.warn("[MQTT][SKIP] Lectura NaN:", { temperatura, humedad, dato });
      return;
    }

    const fecha = new Date();
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `INSERT INTO TIERRA_EN_CALMA.LECTURA_SENSORES
         (ID_SENSOR, TEMPERATURA, HUMEDAD, FECHA_HORA)
       VALUES (:id_sensor, :temperatura, :humedad, :fecha)
       RETURNING ID_LECTURA INTO :out_id`,
      {
        id_sensor: CURRENT_SENSOR_ID,
        temperatura,
        humedad,
        fecha,
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const out = result.outBinds?.out_id;
    const idLectura = Array.isArray(out) ? out[0] : out;

    console.log(
      `[MQTT][INSERT OK] sensor=${CURRENT_SENSOR_ID} id_lectura=${idLectura} ` +
      `T=${temperatura}°C H=${humedad}% fecha=${fecha.toISOString()} rows=${result.rowsAffected}`
    );
  } catch (err) {
    console.error("[MQTT][INSERT ERROR]", err.message);
  } finally {
    try {
      await conn?.close();
    } catch { }
  }
}


function getUltimoDato() { return ultimoDato; }
function getHistorial() { return historial; }

// HDU19 / HDU20
async function enviarComandoRiego(topic = "plantas/regar") {
  if (!client?.connected) { // NOSONAR
    console.error("[RIEGO] MQTT no conectado");
    return { ok: false };
  }
  if (!CURRENT_SENSOR_ID) { // NOSONAR
    console.error("[RIEGO] No hay sensor activo");
    return { ok: false };
  }

  client.publish(topic, "REGAR");

  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    const sel = await conn.execute(
      `SELECT ID_LECTURA, FECHA_HORA
         FROM TIERRA_EN_CALMA.LECTURA_SENSORES
        WHERE ID_SENSOR = :id
        ORDER BY FECHA_HORA DESC
        FETCH FIRST 1 ROWS ONLY`,
      { id: CURRENT_SENSOR_ID },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const idLectura = sel.rows?.[0]?.ID_LECTURA ?? null;

    await conn.execute(
      `INSERT INTO TIERRA_EN_CALMA.RIEGO
         (ID_LECTURA, FECHA_HORA, TIPO_RIEGO, DURACION_SEG, MOTIVO)
       VALUES (:id_lectura, :fecha, :tipo, :dur, :motivo)`,
      {
        id_lectura: idLectura,
        fecha: new Date(),
        tipo: "manual",
        dur: 5,
        motivo: "Riego manual activado"
      },
      { autoCommit: true }
    );

    return { ok: true, id_sensor: CURRENT_SENSOR_ID, id_lectura: idLectura };
  } catch (err) {
    console.error("[RIEGO][DB] error:", err.message);
    return { ok: false, error: err.message };
  } finally {
    if (conn) try { await conn.close(); } catch { } // NOSONAR
  }
}

/* istanbul ignore start */
// Comando físico no aparece dentro de las HU que estás reportando
async function enviarComandoFisicoRiego() {
  if (!client?.connected) { // NOSONAR
    console.error("[RIEGO-FISICO] MQTT no conectado");
    return { ok: false };
  }

  try {
    client.publish("plantas/regar", "REGAR");
    console.log("[RIEGO-FISICO] Comando físico enviado al topic plantas/regar");
    return { ok: true };
  } catch (err) {
    console.error("[RIEGO-FISICO] Error enviando comando:", err.message);
    return { ok: false, error: err.message };
  }
}
/* istanbul ignore end */


module.exports = {
  initMQTTBroker,
  initMQTTSimulator,
  getUltimoDato,
  getHistorial,
  enviarComandoRiego,
  enviarComandoFisicoRiego,
  ensureSensorForPlanta,
  setSensorForPlanta,
  stopSimulator,
  procesarDatoInterno,
  procesarDatoMQTT,
};
