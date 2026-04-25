/**
 * =============================================================
 *  HU-CONTACTO — Prueba de Rendimiento
 *  Funcionalidad: Envío de mensajes mediante el formulario de contacto
 *  Endpoint: POST /api/contacto
 *
 *  Escenario de carga:
 *    Smoke  → 1 VU × 30 s   (validación mínima de disponibilidad)
 *    Load   → 0→10 VU × 1 min (carga normal esperada con rampa)
 *    Stress → 0→25 VU × 30 s  (pico de tráfico)
 *
 *  Cómo ejecutar:
 *    # Smoke (rápido, sólo valida que el endpoint responde)
 *    k6 run -e SCENARIO=smoke backend/k6/01_contacto.test.js
 *
 *    # Load (carga normal)
 *    k6 run -e SCENARIO=load backend/k6/01_contacto.test.js
 *
 *    # Stress (pico de tráfico)
 *    k6 run -e SCENARIO=stress backend/k6/01_contacto.test.js
 *
 *    # Contra staging/producción
 *    k6 run -e K6_BASE_URL=https://mi-backend.up.railway.app \
 *           -e SCENARIO=load backend/k6/01_contacto.test.js
 * =============================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS, DEFAULT_THRESHOLDS, smokeScenario, loadScenario, stressScenario } from './config.js';

// ── Métricas personalizadas ───────────────────────────────────────────────────
const contactoTrend   = new Trend('contacto_duration',   true); // histograma de latencia
const contactoErrors  = new Rate('contacto_error_rate');        // tasa de errores
const contactoSuccess = new Counter('contacto_requests_ok');    // peticiones exitosas

// ── Selección de escenario mediante variable de entorno ───────────────────────
const SCENARIO = __ENV.SCENARIO || 'load';
const scenarioMap = {
  smoke:  smokeScenario(),
  load:   loadScenario(),
  stress: stressScenario(),
};

// ── Opciones K6 ───────────────────────────────────────────────────────────────
export const options = {
  scenarios: scenarioMap[SCENARIO] || loadScenario(),
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    // El endpoint de contacto puede ser más lento (envía correo real)
    // En entorno simulado/test debería ser < 300 ms
    contacto_duration:    ['p(95)<800', 'p(99)<2000'],
    contacto_error_rate:  ['rate<0.01'],
  },
};

// ── Datos de prueba variados ──────────────────────────────────────────────────
const PAYLOADS_VALIDOS = [
  { nombre: 'Ana García',    correo: 'ana@prueba.com',    mensaje: 'Hola, tengo una consulta sobre mis plantas.' },
  { nombre: 'Luis Torres',   correo: 'luis@prueba.com',   mensaje: '¿Cuándo debo regar mi suculenta?' },
  { nombre: 'María López',   correo: 'maria@prueba.com',  mensaje: 'El sistema de riego no funciona.' },
  { nombre: 'Carlos Ruiz',   correo: 'carlos@prueba.com', mensaje: 'Quiero más información sobre el sensor.' },
  { nombre: 'Sofia Mendez',  correo: 'sofia@prueba.com',  mensaje: 'Excelente app, me encanta.' },
];

// ── Función principal ─────────────────────────────────────────────────────────
export default function () {
  // Seleccionar payload de forma round-robin usando el VU ID
  const payload = PAYLOADS_VALIDOS[(__VU - 1) % PAYLOADS_VALIDOS.length];

  // ── Caso 1: Envío exitoso con todos los campos ────────────────────────────
  const resOk = http.post(
    `${BASE_URL}/api/contacto`,
    JSON.stringify(payload),
    { headers: JSON_HEADERS, tags: { endpoint: 'contacto', caso: 'campos_validos' } }
  );

  contactoTrend.add(resOk.timings.duration);

  const okChecks = check(resOk, {
    '[contacto] status 200 con campos válidos':      (r) => r.status === 200,
    '[contacto] body contiene mensaje de éxito':     (r) => {
      try { return JSON.parse(r.body).message !== undefined; } catch { return false; }
    },
    '[contacto] tiempo de respuesta < 800ms':        (r) => r.timings.duration < 800,
  });

  contactoErrors.add(!okChecks);
  if (okChecks) contactoSuccess.add(1);

  sleep(0.5);

  // ── Caso 2: Validación de campos obligatorios (debe rechazar con 400) ─────
  const resInvalido = http.post(
    `${BASE_URL}/api/contacto`,
    JSON.stringify({ nombre: 'Test' }), // faltan correo y mensaje
    { headers: JSON_HEADERS, tags: { endpoint: 'contacto', caso: 'campos_faltantes' } }
  );

  check(resInvalido, {
    '[contacto] rechaza payload incompleto con 400': (r) => r.status === 400,
    '[contacto] body contiene campo error':          (r) => {
      try { return JSON.parse(r.body).error !== undefined; } catch { return false; }
    },
  });

  sleep(1);
}

// ── Resumen de resultados ─────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'stdout': '\n[K6] Test de Contacto completado. Ver resultados arriba.\n',
    '01_contacto_summary.json': JSON.stringify(data, null, 2),
  };
}
