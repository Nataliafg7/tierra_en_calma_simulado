/**
 * =============================================================
 *  HU-MONITOREAR — Prueba de Rendimiento
 *  Funcionalidad: Generación simulada de datos y registro periódico
 *                 de lecturas de temperatura y humedad en la BD
 *  Endpoint: POST /api/monitorear
 *
 *  Descripción del flujo:
 *    El endpoint /api/monitorear asocia un sensor a una planta de
 *    usuario en la BD (Oracle). Esta es la puerta de entrada al ciclo
 *    de telemetría: una vez activo, el simulador comienza a generar
 *    lecturas periódicas T/H que se insertan en LECTURA_SENSORES.
 *
 *  Escenario de carga:
 *    Smoke  → 1 VU × 30 s
 *    Load   → 0→10 VU × 1 min  (múltiples usuarios activando monitoreo)
 *    Stress → 0→20 VU × 30 s   (pico de activaciones simultáneas)
 *
 *  Umbrales de aceptación:
 *    - p95 < 600ms  (operación implica INSERT/SELECT en Oracle)
 *    - Tasa de error < 1%
 *
 *  Cómo ejecutar:
 *    k6 run -e SCENARIO=smoke  backend/k6/03_monitorear.test.js
 *    k6 run -e SCENARIO=load   backend/k6/03_monitorear.test.js
 *    k6 run -e SCENARIO=stress backend/k6/03_monitorear.test.js
 * =============================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS, DEFAULT_THRESHOLDS, smokeScenario, loadScenario, stressScenario } from './config.js';

// ── Métricas personalizadas ───────────────────────────────────────────────────
const monitorearTrend   = new Trend('monitorear_duration',   true);
const monitorearErrors  = new Rate('monitorear_error_rate');
const monitorearSuccess = new Counter('monitorear_requests_ok');

// ── Opciones K6 ───────────────────────────────────────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'load';
const scenarioMap = { smoke: smokeScenario(), load: loadScenario(), stress: stressScenario() };

export const options = {
  scenarios: scenarioMap[SCENARIO] || loadScenario(),
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    // La activación del sensor involucra una operación en Oracle
    monitorear_duration:  ['p(95)<600', 'p(99)<1500'],
    monitorear_error_rate: ['rate<0.01'],
  },
};

// ── IDs de plantas de usuario disponibles para monitoreo (ajustar según BD) ──
// En entorno real, estos IDs deben existir en PLANTAS_USUARIO
const ID_PLANTAS_USUARIO = [1, 2, 3, 4, 5];

// ── Función principal ─────────────────────────────────────────────────────────
export default function () {
  // Seleccionar ID de planta de forma distribuida entre VUs
  const idPlanta = ID_PLANTAS_USUARIO[(__VU - 1) % ID_PLANTAS_USUARIO.length];

  // ── Caso 1: Activar monitoreo con ID válido ───────────────────────────────
  const resOk = http.post(
    `${BASE_URL}/api/monitorear`,
    JSON.stringify({ id_planta_usuario: idPlanta }),
    { headers: JSON_HEADERS, tags: { endpoint: 'monitorear', caso: 'id_valido' } }
  );

  monitorearTrend.add(resOk.timings.duration);

  const okChecks = check(resOk, {
    '[monitorear] status 200 con ID válido':           (r) => r.status === 200,
    '[monitorear] body contiene ok=true':              (r) => {
      try { return JSON.parse(r.body).ok === true; } catch { return false; }
    },
    '[monitorear] body contiene id_sensor':            (r) => {
      try { return JSON.parse(r.body).id_sensor !== undefined; } catch { return false; }
    },
    '[monitorear] latencia < 600ms':                   (r) => r.timings.duration < 600,
  });

  monitorearErrors.add(!okChecks);
  if (okChecks) monitorearSuccess.add(1);

  sleep(0.5);

  // ── Caso 2: Validación de ID inválido (string) → debe rechazar con 400 ────
  const resInvalido = http.post(
    `${BASE_URL}/api/monitorear`,
    JSON.stringify({ id_planta_usuario: 'abc' }),
    { headers: JSON_HEADERS, tags: { endpoint: 'monitorear', caso: 'id_invalido' } }
  );

  check(resInvalido, {
    '[monitorear] rechaza ID no numérico con 400':    (r) => r.status === 400,
    '[monitorear] body contiene campo ok=false':       (r) => {
      try { return JSON.parse(r.body).ok === false; } catch { return false; }
    },
    '[monitorear] body contiene campo error':          (r) => {
      try { return JSON.parse(r.body).error !== undefined; } catch { return false; }
    },
  });

  // ── Caso 3: ID sin planta registrada (no existente) → puede retornar 500 ──
  const resNoExiste = http.post(
    `${BASE_URL}/api/monitorear`,
    JSON.stringify({ id_planta_usuario: 99999 }),
    { headers: JSON_HEADERS, tags: { endpoint: 'monitorear', caso: 'id_no_existente' } }
  );

  check(resNoExiste, {
    '[monitorear] ID inexistente retorna 200 o 500': (r) => r.status === 200 || r.status === 500,
  });

  sleep(1);
}

// ── Resumen de resultados ─────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'stdout': '\n[K6] Test de Monitorear completado. Ver resultados arriba.\n',
    '03_monitorear_summary.json': JSON.stringify(data, null, 2),
  };
}
