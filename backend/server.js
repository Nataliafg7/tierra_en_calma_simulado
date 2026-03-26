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

const app = express();
app.use(cors());
app.use(bodyParser.json());

const IS_TEST = process.env.NODE_ENV === "test";

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN
};

async function testConexionOracle() {
  try {
    const conn = await oracledb.getConnection(dbConfig);
    await conn.close();
  } catch (e) {
    console.error("Error conexión Oracle:", e.message);
  }
}

if (!IS_TEST) {
  testConexionOracle(); // NOSONAR
}

// REGISTRO
app.post("/api/register", async (req, res) => { /* omitido */ });

// LOGIN
app.post("/api/login", async (req, res) => { /* omitido */ });

// CONTACTO
app.post("/api/contacto", async (req, res) => { /* omitido */ });

// PLANTAS
app.post("/api/registrar-planta", async (req, res) => { /* omitido */ });
app.get("/api/plantas", async (req, res) => { /* omitido */ });
app.get("/api/mis-plantas", async (req, res) => { /* omitido */ });

// ADMIN
app.get("/api/admin/vistas", async (req, res) => { /* omitido */ });

// VERIFICAR CONDICIONES
app.post("/api/verificar-condiciones", async (req, res) => { /* omitido */ });

/* istanbul ignore end */

// HDU19 - Simulación riego
app.post("/api/regar", async (req, res) => {
  const resultado = await mqttService.enviarComandoRiego();

  if (resultado.ok) {
    res.json({ message: "Comando de riego enviado" });
  } else {
    res.status(500).json({ error: "No se pudo enviar el comando" });
  }
});

// HDU20 - Registro automático + monitoreo
app.post("/api/monitorear", async (req, res) => {
  const idPlantaUsuario = Number(req.body?.id_planta_usuario);
  if (!Number.isInteger(idPlantaUsuario)) {
    return res.status(400).json({ ok: false, error: "id_planta_usuario inválido" });
  }

  try {
    const idSensor = await mqttService.setSensorForPlanta(idPlantaUsuario);
    return res.json({ ok: true, id_sensor: idSensor });
  } catch (e) {
    console.error("Error en /api/monitorear:", e.message);
    return res.status(500).json({ ok: false, error: "No se pudo preparar el monitoreo" });
}
});

// HDU21 - Lecturas ambientales
app.get("/api/datos", (req, res) => {
  res.json({ dato: mqttService.getUltimoDato() });
});

// HDU25 - Historial / gráfico humedad
app.get("/api/historial", (req, res) => {
  res.json({ historial: mqttService.getHistorial() });
});

// HDU23 - Registro de cuidados
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
      detalle: detalles
    });

    res.status(201).json({ id_cuidado: r.id_cuidado, id_riego: r.id_riego });
  } catch (e) {
    console.error("Error en /api/cuidados:", e.message);
    res.status(500).json({ error: "No se pudo registrar el cuidado" });
}
});


/* istanbul ignore start */

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Errores globales
process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

// Inicio servidor
if (!IS_TEST) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    mqttService.initMQTTSimulator({ everyMs: 2000 });
  });
}

/* istanbul ignore end */

module.exports = app;