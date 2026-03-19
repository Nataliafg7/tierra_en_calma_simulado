// app.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const oracledb = require("oracledb");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const nodemailer = require("nodemailer");

const path = require("path");
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));



const mqttService = require("./mqttService");
const cuidadosService = require("./cuidadosService");
const pkgCentralService = require("./pkgCentralService");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // CONFIGURACIÓN ORACLE
  const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASS,
    connectString: process.env.ORACLE_CONN,
  };

  // ======================= REGISTRO DE USUARIOS =======================
  app.post("/api/register", async (req, res) => {
    const { id_usuario, nombre, apellido, telefono, correo_electronico, contrasena } = req.body;
    try {
      const connection = await oracledb.getConnection(dbConfig);

      await connection.execute(
        `INSERT INTO TIERRA_EN_CALMA.USUARIOS 
         (ID_USUARIO, NOMBRE, APELLIDO, TELEFONO, CORREO_ELECTRONICO, CONTRASENA)
         VALUES (:id_usuario, :nombre, :apellido, :telefono, :correo_electronico, :contrasena)`,
        { id_usuario, nombre, apellido, telefono, correo_electronico, contrasena },
        { autoCommit: true }
      );

      await connection.close();
      res.send({ message: "Usuario registrado con éxito" });
    } catch (err) {
      res.status(500).send({
        error: "Error al registrar usuario",
        detalles: err.message,
      });
    }
  });

  // ======================= LOGIN =======================
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
        const correo = (usuario.CORREO_ELECTRONICO || "").trim().toLowerCase();
        const role = correo === "admin@tierraencalma.com" ? "admin" : "user";

        res.send({ message: "Login exitoso", user: usuario, role });
      } else {
        res.status(401).send({ message: "Credenciales inválidas" });
      }
    } catch (err) {
      res.status(500).send({ error: "Error al iniciar sesión" });
    }
  });

  // ======================= CONTACTO (CORREO) =======================
  app.post("/api/contacto", async (req, res) => {
    const { nombre, correo, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

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
      res.json({ message: "Mensaje enviado correctamente" });
    } catch (err) {
      res.status(500).json({ error: "Error al enviar el correo" });
    }
  });

  // ======================= MQTT DATOS / HISTORIAL =======================
  app.get("/api/datos", (req, res) => {
    res.json({ dato: mqttService.getUltimoDato() });
  });

  app.get("/api/historial", (req, res) => {
    res.json({ historial: mqttService.getHistorial() });
  });

  app.post("/api/monitorear", async (req, res) => {
    const idPlantaUsuario = Number(req.body?.id_planta_usuario);
    if (!Number.isInteger(idPlantaUsuario)) {
      return res.status(400).json({ ok: false, error: "id_planta_usuario inválido" });
    }
    try {
      const idSensor = await mqttService.setSensorForPlanta(idPlantaUsuario);
      return res.json({ ok: true, id_sensor: idSensor });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "No se pudo preparar el monitoreo" });
    }
  });


  // ======================= REGISTRAR PLANTA =======================
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
      res.send({ message: "Planta registrada con éxito en tu jardín" });
    } catch (err) {
      res.status(500).send({ error: "Error al registrar planta" });
    }
  });

  // ======================= LISTA PLANTAS =======================
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
      res.status(500).json({ error: "Error al obtener la lista de plantas" });
    }
  });

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
      if (connection) try { await connection.close(); } catch {}
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
        fecha,
        tipo_cuidado: tipo,
        detalle: detalles,
      });
      res.status(201).json({ id_cuidado: r.id_cuidado, id_riego: r.id_riego });
    } catch (e) {
      res.status(500).json({ error: "No se pudo registrar el cuidado" });
    }
  });

  // ======================= SWAGGER =======================
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // ======================= ADMIN VISTAS =======================
  app.get("/api/admin/vistas", async (req, res) => {
    try {
      const connection = await oracledb.getConnection(dbConfig);
      const opts = { outFormat: oracledb.OUT_FORMAT_OBJECT };

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
        ),
      ]);

      await connection.close();

      const normalizar = (arr) =>
        arr.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toUpperCase(), v])));

      res.json({
        estado_plantas: normalizar(estado.rows),
        historial_riegos: normalizar(riegos.rows),
        alertas_condiciones: normalizar(alertas.rows),
        cuidados_programados: normalizar(cuidados.rows),
      });
    } catch (err) {
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
      res.status(500).json({ ok: false, error: "Error al verificar condiciones" });
    }
  });

  return app;
}

module.exports = { createApp };