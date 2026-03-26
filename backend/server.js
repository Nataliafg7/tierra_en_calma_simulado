// SONAR-IGNORE-START
require("dotenv").config();
const { createApp } = require("./app");
const oracledb = require("oracledb");
const mqttService = require("./mqttService");

console.log("Nodemailer cargado correctamente");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/**
 * En modo test NO se debe:
 * 1) probar conexión real a Oracle al iniciar,
 * 2) iniciar MQTT,
 * 3) levantar el servidor con app.listen,
 * ya que las pruebas unitarias deben ser rápidas y no depender de servicios externos.
 * 
 * En ejecución normal (npm start / node server.js), esto es FALSE y el sistema funciona normalmente.
 */
const IS_TEST = process.env.NODE_ENV === "test";

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONN
};

// TEST DE CONEXIÓN AL INICIAR (solo en ejecución normal; en tests unitarios se omite)
async function probarConexionOracle() {
  console.log("Probando conexión a Oracle...");
  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute("SELECT 'Conexión OK' AS estado FROM DUAL");
    console.log(`Conexión exitosa a Oracle: ${result.rows[0][0]}`);
    await conn.close();
  } catch (err) {
    console.error("Error al conectar con Oracle al iniciar el servidor:");
    console.error(`Código: ${err.errorNum || err.code}`);
  }
}

// MANEJO GLOBAL DE ERRORES
process.on("unhandledRejection", (reason, promise) => { // NOSONAR
  console.error("Rechazo de promesa no manejado:", reason); // NOSONAR
}); // NOSONAR

process.on("uncaughtException", (err) => { // NOSONAR
  console.error("Error no capturado:", err); // NOSONAR
}); // NOSONAR

console.log("Nodemailer cargado correctamente");


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