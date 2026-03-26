let interval = null;
let procesarDatoCallback = null;

function startSimulator({ everyMs = 10000, onDato = null } = {}) {
  procesarDatoCallback = onDato;
  let t = 24;
  let h = 55;

  console.log("[SIM] Iniciado - Generando datos cada", everyMs, "ms");

  interval = setInterval(() => {
    // random walk simple
    t += (Math.random() - 0.5); // NOSONAR
    h += (Math.random() - 0.5) * 2; // NOSONAR

    t = Math.max(0, Math.min(52, t)); //modifcar el valor 0 y 45 que es el rango
    h = Math.max(0, Math.min(95, h));

    const dato = `T:${t.toFixed(2)},H:${h.toFixed(2)}%`;

    console.log(`[SIM] Dato generado: ${dato}`);

    if (procesarDatoCallback) {
      Promise.resolve(procesarDatoCallback(dato)).catch(err => {
        console.error("[SIM] Error procesando dato:", err.message);
      });
    }

  }, everyMs);
}

function stopSimulator() {
  if (interval) clearInterval(interval);
  console.log("[SIM] Detenido");
}

module.exports = { startSimulator, stopSimulator };