require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const oracledb = require("oracledb");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const nodemailer = require("nodemailer");
const path = require("node:path");
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const mqttService = require("./mqttService");
const cuidadosService = require("./cuidadosService");
const pkgCentralService = require("./pkgCentralService");

// ======================= FUNCIONES AUXILIARES =======================
/* istanbul ignore next */
function convertirClavesAMayusculas(objeto) {
  const entradas = Object.entries(objeto);
  const entradasConvertidas = entradas.map(([clave, valor]) => [
    clave.toUpperCase(),
    valor,
  ]);
  return Object.fromEntries(entradasConvertidas);
}

/* istanbul ignore next */
function normalizar(arreglo) {
  return arreglo.map(convertirClavesAMayusculas);
}

function createApp() {
  const app = express();

  const corsOptions = {
    origin: [
      "http://localhost:4200",
      "http://localhost:3000",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    credentials: true
  };
  app.use(cors(corsOptions)); // NOSONAR
  app.use(bodyParser.json());
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASS,
    connectString: process.env.ORACLE_CONN,
  };

  // ======================= REGISTRO DE USUARIOS =======================
  app.post("/api/register", async (req, res) => {
    const {
      id_usuario,
      nombre,
      apellido,
      telefono,
      correo_electronico,
      contrasena,
    } = req.body;

    // ================= VALIDACIÓN DE CAMPOS =================
    if (
      id_usuario === undefined ||
      !nombre ||
      !apellido ||
      !telefono ||
      !correo_electronico ||
      !contrasena
    ) {
      return res.status(400).send({
        error: "Todos los campos son obligatorios",
      });
    }

    // ================= VALIDACIÓN DE CORREO (SIN REGEX) =================
    const correo = correo_electronico.trim();

    if (
      correo.includes(" ") ||
      !correo.includes("@") ||
      correo.indexOf("@") !== correo.lastIndexOf("@")
    ) {
      return res.status(400).send({
        error: "El correo electrónico no es válido",
      });
    }

    const partesCorreo = correo.split("@");
    const parteLocal = partesCorreo[0];
    const dominio = partesCorreo[1];

    if (
      parteLocal.length === 0 ||
      !dominio?.includes(".") ||
      dominio?.startsWith(".") ||
      dominio?.endsWith(".")
    ) {
      return res.status(400).send({
        error: "El correo electrónico no es válido",
      });
    }
    // ================= VALIDACIÓN DE CONTRASEÑA =================
    if (contrasena.length < 8) {
      return res.status(400).send({
        error: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    let connection;

    try {
      connection = await oracledb.getConnection(dbConfig);

      await connection.execute(
        `INSERT INTO TIERRA_EN_CALMA.USUARIOS
       (ID_USUARIO, NOMBRE, APELLIDO, TELEFONO, CORREO_ELECTRONICO, CONTRASENA)
       VALUES (:id_usuario, :nombre, :apellido, :telefono, :correo_electronico, :contrasena)`,
        {
          id_usuario,
          nombre,
          apellido,
          telefono,
          correo_electronico: correo,
          contrasena,
        },
        { autoCommit: true }
      );

      return res.send({
        message: "Usuario registrado con éxito",
      });
    } catch (err) {
      return res.status(500).send({
        error: "Error al registrar usuario",
        detalles: err.message,
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error("Error al cerrar la conexión en registro:", closeError);
        }
      }
    }
  });  // ======================= LOGIN =======================
  app.post("/api/login", async (req, res) => {
    const { correo_electronico, contrasena } = req.body;

    if (!correo_electronico || !contrasena) {
      return res.status(400).send({
        message: "El correo y la contraseña son obligatorios",
      });
    }

    let connection;

    try {
      connection = await oracledb.getConnection(dbConfig);

      const result = await connection.execute(
        `SELECT ID_USUARIO, NOMBRE, APELLIDO, TELEFONO, CORREO_ELECTRONICO
         FROM TIERRA_EN_CALMA.USUARIOS
         WHERE LOWER(CORREO_ELECTRONICO) = LOWER(:correo_electronico)
         AND CONTRASENA = :contrasena`,
        {
          correo_electronico: correo_electronico,
          contrasena: contrasena,
        },
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );

      if (result.rows.length > 0) {
        const usuario = result.rows[0];
        const correo = (usuario.CORREO_ELECTRONICO || "").trim().toLowerCase();
        const role =
          correo === "admin@tierraencalma.com" ? "admin" : "user";

        return res.send({
          message: "Login exitoso",
          user: usuario,
          role: role,
        });
      }

      return res.status(401).send({
        message: "Credenciales inválidas",
      });
    } catch (err) {
      console.error("Error en login:", err);
      return res.status(500).send({
        error: "Error al iniciar sesión",
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error(
            "Error al cerrar la conexión en login:",
            closeError
          );
        }
      }
    }
  });
  // SONAR-IGNORE-END

  // ======================= CONTACTO (CORREO) =======================
  /* istanbul ignore next */
  app.post("/api/contacto", async (req, res) => {
    const { nombre, correo, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
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
      return res.json({
        message: "Mensaje enviado correctamente",
      });
    } catch (err) {
      console.error("Error al enviar correo:", err);
      return res.status(500).json({
        error: "Error al enviar el correo",
      });
    }
  });

  // ======================= MQTT DATOS / HISTORIAL =======================
  /* istanbul ignore next */
  app.get("/api/datos", (req, res) => {
    return res.json({
      dato: mqttService.getUltimoDato(),
    });
  });

  /* istanbul ignore next */
  app.get("/api/historial", (req, res) => {
    return res.json({
      historial: mqttService.getHistorial(),
    });
  });

  // ======================= MONITOREAR =======================
  /* istanbul ignore next */
  app.post("/api/monitorear", async (req, res) => {
    const idPlantaUsuario = Number(req.body?.id_planta_usuario);

    if (!Number.isInteger(idPlantaUsuario)) {
      return res.status(400).json({
        ok: false,
        error: "id_planta_usuario inválido",
      });
    }
    try {
      const idSensor = await mqttService.setSensorForPlanta(idPlantaUsuario);

      return res.json({
        ok: true,
        id_sensor: idSensor,
      });
    } catch (e) {
      console.error("Error al preparar el monitoreo:", e);
      return res.status(500).json({
        ok: false,
        error: "No se pudo preparar el monitoreo",
      });
    }
  });

  // ======================= REGISTRAR PLANTA =======================
  app.post("/api/registrar-planta", async (req, res) => {
    const { id_usuario, id_planta } = req.body;
    let connection;

    if (!id_usuario || !id_planta) {
      return res.status(400).send({
        error: "Datos incompletos para registrar la planta",
      });
    }

    try {
      connection = await oracledb.getConnection(dbConfig);

      await connection.execute(
        `INSERT INTO TIERRA_EN_CALMA.PLANTAS_USUARIO
         (ID_PLANTA, ID_USUARIO, ESTADO, NOMBRE_PERSONALIZADO)
         VALUES (:id_planta, :id_usuario, 'activa', NULL)`,
        { id_planta, id_usuario },
        { autoCommit: true }
      );

      return res.send({
        message: "Planta registrada con éxito en tu jardín",
      });
    } catch (err) {
      console.error("Error al registrar planta:", err);
      return res.status(500).send({
        error: "Error al registrar planta",
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error(
            "Error al cerrar conexión en registrar planta:",
            closeError
          );
        }
      }
    }
  });

  // ======================= LISTA PLANTAS =======================
  app.get("/api/plantas", async (req, res) => {
    let connection;

    try {
      connection = await oracledb.getConnection(dbConfig);

      const result = await connection.execute(
        `SELECT ID_PLANTA, NOMBRE_COMUN
         FROM TIERRA_EN_CALMA.BANCO_PLANTAS
         ORDER BY NOMBRE_COMUN`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      return res.json(result.rows);
    } catch (err) {
      console.error("Error al obtener lista de plantas:", err);
      return res.status(500).json({
        error: "Error al obtener la lista de plantas",
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error(
            "Error al cerrar conexión en lista de plantas:",
            closeError
          );
        }
      }
    }
  });

  // ======================= MIS PLANTAS =======================
  app.get("/api/mis-plantas", async (req, res) => {
    const raw = req.header("x-user-id");
    const rawNormalizado = typeof raw === "string" ? raw.trim() : "";
    const id_usuario = Number(rawNormalizado);

    if (rawNormalizado === "" || !Number.isInteger(id_usuario)) {
      return res.status(400).json({
        error: "x-user-id inválido",
      });
    }

    let connection;

    try {
      connection = await oracledb.getConnection(dbConfig);

      const result = await connection.execute(
        `SELECT
           pu.ID_PLANTA_USUARIO AS ID_PLANTA_USUARIO,
           bp.ID_PLANTA AS ID_PLANTA,
           bp.NOMBRE_COMUN AS NOMBRE_COMUN,
           bp.NOMBRE_CIENTIFICO AS NOMBRE_CIENTIFICO
         FROM TIERRA_EN_CALMA.PLANTAS_USUARIO pu
         JOIN TIERRA_EN_CALMA.BANCO_PLANTAS bp
           ON pu.ID_PLANTA = bp.ID_PLANTA
         WHERE pu.ID_USUARIO = :id_usuario`,
        { id_usuario },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      return res.json(result.rows || []);
    } catch (err) {
      console.error("Error al obtener las plantas del usuario:", err);
      return res.status(500).json({
        error: "Error al obtener las plantas del usuario",
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error(
            "Error al cerrar conexión de mis plantas:",
            closeError
          );
        }
      }
    }
  });

  // ======================= CUIDADOS =======================
  /* istanbul ignore next */
  app.post("/api/cuidados", async (req, res) => {
    const { id_planta_usuario, fecha, tipo, detalles } = req.body;

    if (!id_planta_usuario || !fecha || !tipo) {
      return res.status(400).json({
        error: "id_planta_usuario, fecha y tipo son obligatorios",
      });
    }

    try {
      const r = await cuidadosService.crearCuidado({
        id_planta_usuario: Number(id_planta_usuario),
        fecha: fecha,
        tipo_cuidado: tipo,
        detalle: detalles,
      });

      return res.status(201).json({
        id_cuidado: r.id_cuidado,
        id_riego: r.id_riego,
      });
    } catch (e) {
      console.error("Error al registrar el cuidado:", e);
      return res.status(500).json({
        error: "No se pudo registrar el cuidado",
      });
    }
  });

  // ======================= ADMIN VISTAS =======================
  /* istanbul ignore next */
  app.get("/api/admin/vistas", async (req, res) => {
    let connection;

    try {
      connection = await oracledb.getConnection(dbConfig);
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

      return res.json({
        estado_plantas: normalizar(estado.rows),
        historial_riegos: normalizar(riegos.rows),
        alertas_condiciones: normalizar(alertas.rows),
        cuidados_programados: normalizar(cuidados.rows),
      });
    } catch (err) {
      console.error("Error al consultar las vistas administrativas:", err);
      return res.status(500).json({
        error: "Error al consultar las vistas administrativas",
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error(
            "Error al cerrar conexión en vistas administrativas:",
            closeError
          );
        }
      }
    }
  });
  // SONAR-IGNORE-END

  // ======================= VERIFICAR CONDICIONES =======================
  /* istanbul ignore next */
  app.post("/api/verificar-condiciones", async (req, res) => {
    const idPlantaUsuario = Number(req.body?.id_planta_usuario);

    if (!Number.isInteger(idPlantaUsuario)) {
      return res.status(400).json({
        ok: false,
        error: "id_planta_usuario inválido",
      });
    }

    try {
      const result = await pkgCentralService.verificarCondiciones(idPlantaUsuario);
      return res.json(result);
    } catch (e) {
      console.error("Error al verificar condiciones:", e);
      return res.status(500).json({
        ok: false,
        error: "Error al verificar condiciones",
      });
    }
  });
  // SONAR-IGNORE-START

  return app;
}

module.exports = { createApp };
// SONAR-IGNORE-END