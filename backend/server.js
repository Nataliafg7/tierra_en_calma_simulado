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

// MANEJO GLOBAL DE ERRORES
process.on("unhandledRejection", (reason) => { // NOSONAR
  console.error("Rechazo de promesa no manejado:", reason); // NOSONAR
}); // NOSONAR

process.on("uncaughtException", (err) => { // NOSONAR
  console.error("Error no capturado:", err); // NOSONAR
}); // NOSONAR

async function testOracleConnection() {
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

const app = createApp();
app.testOracleConnection = testOracleConnection;

if (!IS_TEST) { // NOSONAR
  testOracleConnection().catch(console.error); // NOSONAR

  mqttService.initMQTTSimulator({ everyMs: 10000 }); // NOSONAR
} // NOSONAR

if (require.main === module) { // NOSONAR
  const PORT = process.env.PORT || 3000; // NOSONAR
  app.listen(PORT, () => { // NOSONAR
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`); // NOSONAR
  }); // NOSONAR
} // NOSONAR

module.exports = app;
// SONAR-IGNORE-END
