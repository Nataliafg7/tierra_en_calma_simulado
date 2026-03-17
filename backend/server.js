require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const oracledb = require("oracledb");
const cors = require("cors");
const mqtt = require("mqtt");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const nodemailer = require("nodemailer");
const mqttService = require("./mqttService");
const cuidadosService = require("./cuidadosService");
const pkgCentralService = require("./pkgCentralService");

console.log("Nodemailer cargado correctamente");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/**
 * NUEVO (para pruebas unitarias):
 * - Cuando corremos Jest ponemos NODE_ENV=test.
 * - En ese modo NO queremos:
 *   1) probar conexión real a Oracle al iniciar,
 *   2) iniciar MQTT,
 *   3) levantar el servidor con app.listen,
 * porque las unitarias deben ser rápidas y no depender de servicios externos.
 * En ejecución normal (npm start / node server.js) esto queda FALSE y todo funciona igual que antes.
 */
const IS_TEST = process.env.NODE_ENV === "test";

//CONFIGURACIÓN ORACLE
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN
};

// TEST DE CONEXIÓN AL INICIAR (solo en ejecución normal; en tests unitarios se omite)
if (!IS_TEST) {
  (async () => {
    console.log("Probando conexión a Oracle...");
    try {
      const conn = await oracledb.getConnection(dbConfig);
      const result = await conn.execute("SELECT 'Conexión OK' AS estado FROM DUAL");
      console.log(`Conexión exitosa a Oracle: ${result.rows[0][0]}`);
      await conn.close();
    } catch (err) {
      console.error("Error al conectar con Oracle al iniciar el servidor:");
      console.error(`Código: ${err.errorNum || err.code}`);
      console.error(`Mensaje: ${err.message}`);
    }
  })();
}

// REGISTRO DE USUARIOS
app.post("/api/register", async (req, res) => {
  const { id_usuario, nombre, apellido, telefono, correo_electronico, contrasena } = req.body;
  try {
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `INSERT INTO TIERRA_EN_CALMA.USUARIOS 
       (ID_USUARIO, NOMBRE, APELLIDO, TELEFONO, CORREO_ELECTRONICO, CONTRASENA)
       VALUES (:id_usuario, :nombre, :apellido, :telefono, :correo_electronico, :contrasena)`,
      { id_usuario, nombre, apellido, telefono, correo_electronico, contrasena },
      { autoCommit: true }
    );

    console.log("Usuario registrado:", result);
    await connection.close();

    res.send({ message: "Usuario registrado con éxito" });

  } catch (err) {
    console.error("Error Oracle al registrar usuario:");
    console.error(`Código: ${err.errorNum || err.code}`);
    console.error(`Mensaje: ${err.message}`);
    res.status(500).send({
      error: "Error al registrar usuario",
      detalles: err.message
    });
  }
});

//  LOGIN
app.post("/api/login", async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT ID_USUARIO, NOMBRE, APELLIDO, TELEFONO, CORREO_ELECTRONICO
       FROM TIERRA_EN_CALMA.USUARIOS
       WHERE LOWER(CORREO_ELECTRONICO) = LOWER(:correo_electronico)
       AND CONTRASENA = :contrasena`,
      { correo_electronico, contrasena },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      const correo = (usuario.CORREO_ELECTRONICO || '').trim().toLowerCase();

      // DETECTAR ADMINISTRADOR
      const role = correo === 'admin@tierraencalma.com' ? 'admin' : 'user';

      console.log(`Login exitoso para ${correo} (rol: ${role})`);

      res.send({
        message: "Login exitoso",
        user: usuario,
        role: role
      });
    } else {
      console.warn(`Intento fallido de login: ${correo_electronico}`);
      res.status(401).send({ message: "Credenciales inválidas" });
    }

  } catch (err) {
    console.error("Error en login:");
    console.error(`Código: ${err.errorNum || err.code}`);
    console.error(`Mensaje: ${err.message}`);
    res.status(500).send({ error: "Error al iniciar sesión" });
  }
});


// ======================= NUEVA RUTA: CONTACTO (CORREO) =======================
app.post("/api/contacto", async (req, res) => {
  const { nombre, correo, mensaje } = req.body;

  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  // Configuración del transporte de correo (Gmail App Password)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Tierra en Calma" <${process.env.GMAIL_USER}>`,
    to: "tierraencalma.a@gmail.com",
    subject: `Nuevo mensaje de contacto de ${nombre}`,
    html: `
      <h3>Nuevo mensaje desde el formulario de contacto</h3>
      <p><b>Nombre:</b> ${nombre}</p>
      <p><b>Correo:</b> ${correo}</p>
      <p><b>Mensaje:</b><br>${mensaje}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de contacto enviado por ${nombre} <${correo}>`);
    res.json({ message: "Mensaje enviado correctamente" });
  } catch (err) {
    console.error("Error al enviar correo:", err);
    res.status(500).json({ error: "Error al enviar el correo" });
  }
});


// ======================= CONFIGURACIÓN MQTT =======================
// NUEVO: en pruebas unitarias no iniciamos MQTT (no es necesario para probar /api/register)
if (!IS_TEST) {
  mqttService.initMQTT(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
  }, process.env.MQTT_TOPIC);
}

app.get("/api/datos", (req, res) => {
  res.json({ dato: mqttService.getUltimoDato() });
});

app.get("/api/historial", (req, res) => {
  res.json({ historial: mqttService.getHistorial() });
});

app.post("/api/regar", (req, res) => {
  const enviado = mqttService.enviarComandoRiego();
  if (enviado) res.json({ message: "Comando de riego enviado" });
  else res.status(500).json({ error: "No se pudo enviar el comando" });
});

app.post('/api/monitorear', async (req, res) => {
  const idPlantaUsuario = Number(req.body?.id_planta_usuario);
  if (!Number.isInteger(idPlantaUsuario)) {
    return res.status(400).json({ ok: false, error: 'id_planta_usuario inválido' });
  }
  try {
    const idSensor = await mqttService.setSensorForPlanta(idPlantaUsuario);
    return res.json({ ok: true, id_sensor: idSensor });
  } catch (e) {
    console.error('[monitorear] error:', e);
    return res.status(500).json({ ok: false, error: 'No se pudo preparar el monitoreo' });
  }
});

// ======================= PLANTAS =======================
app.post("/api/regar", (req, res) => {
  try {
    client.publish("plantas/regar", "REGAR");
    console.log("Comando de riego enviado (topic plantas/regar)");
    res.json({ message: "Comando de riego enviado a la planta" });
  } catch (err) {
    console.error("Error publicando en MQTT:", err);
    res.status(500).json({ error: "Error al activar el riego" });
  }
});

app.post("/api/registrar-planta", async (req, res) => {
  const { id_usuario, id_planta } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    await connection.execute(
      `INSERT INTO TIERRA_EN_CALMA.PLANTAS_USUARIO 
       (ID_PLANTA, ID_USUARIO, ESTADO, NOMBRE_PERSONALIZADO)
       VALUES (:id_planta, :id_usuario, 'activa', NULL)`,
      { id_planta, id_usuario },
      { autoCommit: true }
    );

    await connection.close();
    console.log(`Planta registrada (usuario: ${id_usuario}, planta: ${id_planta})`);
    res.send({ message: "Planta registrada con éxito en tu jardín" });

  } catch (err) {
    console.error("Error al registrar planta:");
    console.error(`Código: ${err.errorNum || err.code}`);
    console.error(`Mensaje: ${err.message}`);
    res.status(500).send({ error: "Error al registrar planta" });
  }
});

// ======================= OBTENER LISTA DE PLANTAS =======================
app.get("/api/plantas", async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID_PLANTA, NOMBRE_COMUN 
       FROM TIERRA_EN_CALMA.BANCO_PLANTAS
       ORDER BY NOMBRE_COMUN`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener plantas:");
    console.error(`Código: ${err.errorNum || err.code}`);
    console.error(`Mensaje: ${err.message}`);
    res.status(500).json({ error: "Error al obtener la lista de plantas" });
  }
});

// ======================= OBTENER PLANTAS DE UN USUARIO =======================
app.get("/api/mis-plantas", async (req, res) => {
  const raw = req.header("x-user-id");
  const id_usuario = Number(raw);
  if (!Number.isInteger(id_usuario)) {
    return res.status(400).json({ error: "x-user-id inválido" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
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
    console.error("Error al obtener plantas del usuario:", err);
    res.status(500).json({ error: "Error al obtener las plantas del usuario" });
  } finally {
    if (connection) try { await connection.close(); } catch { }
  }
});

// ======================= CUIDADOS =======================
app.post("/api/cuidados", async (req, res) => {
  const { id_planta_usuario, fecha, tipo, detalles } = req.body;
  if (!id_planta_usuario || !fecha || !tipo) {
    return res.status(400).json({ error: "id_planta_usuario, fecha y tipo son obligatorios" });
  }

  try {
    const r = await cuidadosService.crearCuidado({
      id_planta_usuario: Number(id_planta_usuario),
      fecha,                         // 'YYYY-MM-DD' o ISO
      tipo_cuidado: tipo,
      detalle: detalles,
    });
    res.status(201).json({ id_cuidado: r.id_cuidado, id_riego: r.id_riego });
  } catch (e) {
    console.error("[API][CUIDADOS] error:", e.message);
    res.status(500).json({ error: "No se pudo registrar el cuidado" });
  }
});

// ======================= SWAGGER =======================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ======================= MANEJO GLOBAL DE ERRORES =======================
process.on("unhandledRejection", (reason, promise) => {
  console.error("Rechazo de promesa no manejado:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Error no capturado:", err);
});

// ======================= RUTA PARA VISTAS DEL ADMIN =======================
app.get("/api/admin/vistas", async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const opts = { outFormat: oracledb.OUT_FORMAT_OBJECT };

    // Mostrar solo los últimos 10 registros por vista
    const [estado, riegos, alertas, cuidados] = await Promise.all([
      connection.execute(
        `SELECT * FROM (
           SELECT * FROM TIERRA_EN_CALMA.VW_ESTADO_PLANTAS_USUARIO 
           ORDER BY FECHA_HORA DESC
         ) WHERE ROWNUM <= 10`,
        [],
        opts
      ),
      connection.execute(
        `SELECT * FROM (
           SELECT * FROM TIERRA_EN_CALMA.VW_HISTORIAL_RIEGOS 
           ORDER BY FECHA_HORA DESC
         ) WHERE ROWNUM <= 10`,
        [],
        opts
      ),
      connection.execute(
        `SELECT * FROM (
           SELECT * FROM TIERRA_EN_CALMA.VW_ALERTAS_CONDICIONES 
           ORDER BY TEMPERATURA DESC
         ) WHERE ROWNUM <= 10`,
        [],
        opts
      ),
      connection.execute(
        `SELECT * FROM (
           SELECT * FROM TIERRA_EN_CALMA.VW_CUIDADOS_PROGRAMADOS 
           ORDER BY FECHA DESC
         ) WHERE ROWNUM <= 10`,
        [],
        opts
      )
    ]);

    await connection.close();

    console.log("Vistas administrativas consultadas correctamente (limitadas a 10 registros).");

    // Normalizar claves en mayúsculas
    const normalizar = (arr) =>
      arr.map((r) =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toUpperCase(), v]))
      );

    res.json({
      estado_plantas: normalizar(estado.rows),
      historial_riegos: normalizar(riegos.rows),
      alertas_condiciones: normalizar(alertas.rows),
      cuidados_programados: normalizar(cuidados.rows),
    });
  } catch (err) {
    console.error("Error al obtener vistas del admin:", err);
    res.status(500).json({ error: "Error al consultar las vistas administrativas" });
  }
});

// ======================= VERIFICAR CONDICIONES =======================
app.post("/api/verificar-condiciones", async (req, res) => {
  const idPlantaUsuario = Number(req.body?.id_planta_usuario);
  if (!Number.isInteger(idPlantaUsuario)) {
    return res.status(400).json({ ok: false, error: "id_planta_usuario inválido" });
  }

  try {
    const result = await pkgCentralService.verificarCondiciones(idPlantaUsuario);
    res.json(result);
  } catch (e) {
    console.error("[API][VERIFICAR_CONDICIONES] error:", e.message);
    res.status(500).json({ ok: false, error: "Error al verificar condiciones" });
  }
});

console.log("Rutas cargadas: /api/verificar-condiciones habilitada");

app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(" Ruta registrada:", r.route.path);
  }
});

// ======================= INICIO SERVIDOR =======================
// NUEVO: en pruebas unitarias NO levantamos servidor real. En ejecución normal funciona igual que antes.
if (!IS_TEST) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`Intentando conectar con Oracle: ${dbConfig.connectString}`);

    // Iniciar simulador de sensores
    console.log("[INIT] Iniciando simulador de sensores...");
    mqttService.initMQTT(null, { everyMs: 10000 }, null, true);
  });
}

// NUEVO: exportar app para que Jest/Supertest puedan probar /api/register sin levantar el servidor
module.exports = app;