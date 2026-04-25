/**
 * =============================================================
 *  HU-SENSOR-DATOS — Prueba de Rendimiento
 *  Funcionalidad: Visualización de la última lectura de temperatura y humedad
 *  Endpoints:
 *    GET /api/datos     → última lectura T/H
 *    GET /api/historial → historial de lecturas
 *
 *  Escenario de carga:
 *    Este endpoint es consultado de forma continua por el dashboard.
 *    Se espera alta frecuencia de lecturas (polling), por lo que se
 *    simula una carga mayor que el resto de funcionalidades.
 *
 *    Smoke  → 1 VU × 30 s
 *    Load   → 0→20 VU × 1 min  (dashboard de múltiples usuarios simultáneos)
 *    Stress → 0→50 VU × 30 s   (pico máximo esperado)
 *
 *  Cómo ejecutar:
 *    k6 run -e SCENARIO=smoke  backend/k6/02_sensor_datos.test.js
 *    k6 run -e SCENARIO=load   backend/k6/02_sensor_datos.test.js
 *    k6 run -e SCENARIO=stress backend/k6/02_sensor_datos.test.js
 * =============================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS, DEFAULT_THRESHOLDS } from './config.js';

// ── Métricas personalizadas ───────────────────────────────────────────────────
const datosTrend    = new Trend('sensor_datos_duration',   true);
const historialTrend = new Trend('sensor_historial_duration', true);
const sensorErrors  = new Rate('sensor_error_rate');
const sensorSuccess = new Counter('sensor_requests_ok');

// ── Escenarios de alta frecuencia (GET es intensivo en concurrencia) ──────────
const SCENARIO = __ENV.SCENARIO || 'load';

const scenarios = {
  smoke: {
    smoke: { executor: 'constant-vus', vus: 1, duration: '30s', tags: { scenario: 'smoke' } },
  },
  load: {
    load_datos: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '1m',  target: 20 },
        { duration: '10s', target: 0  },
      ],
      tags: { scenario: 'load' },
    },
  },
  stress: {
    stress_datos: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 0  },
      ],
      tags: { scenario: 'stress' },
    },
  },
};

// ── Opciones K6 ───────────────────────────────────────────────────────────────
export const options = {
  scenarios: scenarios[SCENARIO] || scenarios.load,
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    // Los GETs de datos deben ser muy rápidos (en memoria, sin DB)
    sensor_datos_duration:    ['p(95)<100', 'p(99)<300'],
    sensor_historial_duration: ['p(95)<150', 'p(99)<400'],
    sensor_error_rate:        ['rate<0.01'],
  },
};

// ── Función principal ─────────────────────────────────────────────────────────
export default function () {

  // ── Caso 1: Consultar última lectura de temperatura y humedad ─────────────
  const resDatos = http.get(
    `${BASE_URL}/api/datos`,
    { tags: { endpoint: 'datos', caso: 'ultima_lectura' } }
  );

  datosTrend.add(resDatos.timings.duration);

  const datosChecks = check(resDatos, {
    '[sensor] GET /api/datos responde 200':             (r) => r.status === 200,
    '[sensor] body contiene campo "dato"':              (r) => {
      try { return 'dato' in JSON.parse(r.body); } catch { return false; }
    },
    '[sensor] latencia de última lectura < 100ms':      (r) => r.timings.duration < 100,
  });

  sensorErrors.add(!datosChecks);
  if (datosChecks) sensorSuccess.add(1);

  sleep(0.2); // Simular polling cada 200ms

  // ── Caso 2: Consultar historial de lecturas ────────────────────────────────
  const resHistorial = http.get(
    `${BASE_URL}/api/historial`,
    { tags: { endpoint: 'historial', caso: 'historial_lecturas' } }
  );

  historialTrend.add(resHistorial.timings.duration);

  check(resHistorial, {
    '[sensor] GET /api/historial responde 200':          (r) => r.status === 200,
    '[sensor] body contiene campo "historial"':          (r) => {
      try { return 'historial' in JSON.parse(r.body); } catch { return false; }
    },
    '[sensor] body historial es un arreglo':             (r) => {
      try { return Array.isArray(JSON.parse(r.body).historial); } catch { return false; }
    },
    '[sensor] latencia de historial < 150ms':            (r) => r.timings.duration < 150,
  });

  sleep(0.3);
}

// ── Resumen de resultados ─────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'stdout': '\n[K6] Test de Sensor Datos completado. Ver resultados arriba.\n',
    '02_sensor_datos_summary.json': JSON.stringify(data, null, 2),
  };
}
