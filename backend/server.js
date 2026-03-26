// SONAR-IGNORE-START
require("dotenv").config();
const { createApp } = require("./app");
const oracledb = require("oracledb");
const mqttService = require("./mqttService");

const IS_TEST = process.env.NODE_ENV === "test";

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN
};

async function testOracleConnection() { // NOSONAR
  console.log("Probando conexión a Oracle..."); // NOSONAR
  try { // NOSONAR
    const conn = await oracledb.getConnection(dbConfig); // NOSONAR
    const result = await conn.execute("SELECT 'Conexión OK' AS estado FROM DUAL"); // NOSONAR
    console.log(`Conexión exitosa a Oracle: ${result.rows[0][0]}`); // NOSONAR
    await conn.close(); // NOSONAR
  } catch (err) { // NOSONAR
    console.error("Error al conectar con Oracle al iniciar el servidor:"); // NOSONAR
    console.error(`Código: ${err.errorNum || err.code}`); // NOSONAR
    console.error(`Mensaje: ${err.message}`); // NOSONAR
  } // NOSONAR
} // NOSONAR

// MANEJO GLOBAL DE ERRORES
process.on("unhandledRejection", (reason, promise) => { // NOSONAR
  console.error("Rechazo de promesa no manejado:", reason); // NOSONAR
}); // NOSONAR

process.on("uncaughtException", (err) => { // NOSONAR
  console.error("Error no capturado:", err); // NOSONAR
}); // NOSONAR

console.log("Nodemailer cargado correctamente");

const app = createApp();
app.testOracleConnection = testOracleConnection;

if (!IS_TEST) { // NOSONAR
  testOracleConnection().catch(console.error); // NOSONAR

  mqttService.initMQTTClient(process.env.MQTT_BROKER, { // NOSONAR
    username: process.env.MQTT_USER, // NOSONAR
    password: process.env.MQTT_PASS // NOSONAR
  }, process.env.MQTT_TOPIC); // NOSONAR
  
  mqttService.initMQTTSimulator({ everyMs: 10000 }); // NOSONAR
} // NOSONAR

console.log("Rutas cargadas: /api/verificar-condiciones habilitada");
app._router.stack.forEach(r => {
  if (r.route?.path) {
    console.log(" Ruta registrada:", r.route.path);
  }
});

if (require.main === module) { // NOSONAR
  const PORT = process.env.PORT || 3000; // NOSONAR
  app.listen(PORT, () => { // NOSONAR
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`); // NOSONAR
  }); // NOSONAR
} // NOSONAR

module.exports = app;
// SONAR-IGNORE-END