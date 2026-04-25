/**
 * =============================================================
 *  HU-VERIFICAR-CONDICIONES — Prueba de Rendimiento
 *  Funcionalidad: Verificación manual de condiciones de la planta
 *  Endpoint: POST /api/verificar-condiciones
 *
 *  Descripción del flujo:
 *    El usuario presiona "Verificar condiciones". El backend:
 *      1. Consulta la última lectura T/H de Oracle para la planta.
 *      2. Ejecuta un stored procedure (PKG_CENTRAL) que evalúa umbrales.
 *      3. Si humedad < umbral → activa riego físico vía MQTT.
 *      4. Retorna un mensaje descriptivo con el estado.
 *
 *    Es la operación más pesada del sistema: implica múltiples
 *    accesos a BD + potencial disparo de riego MQTT.
 *
 *  Umbrales de aceptación:
 *    - p95 < 1000ms  (operación compleja con BD + stored proc)
 *    - p99 < 3000ms
 *    - Tasa de error < 1%
 *
 *  Escenarios:
 *    Smoke  → 1 VU × 30 s
 *    Load   → 0→8 VU × 1 min   (tráfico normal de verificaciones)
 *    Stress → 0→15 VU × 30 s   (pico de verificaciones manuales)
 *
 *  Cómo ejecutar:
 *    k6 run -e SCENARIO=smoke  backend/k6/04_verificar_condiciones.test.js
 *    k6 run -e SCENARIO=load   backend/k6/04_verificar_condiciones.test.js
 *    k6 run -e SCENARIO=stress backend/k6/04_verificar_condiciones.test.js
 * =============================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS, DEFAULT_THRESHOLDS } from './config.js';

// ── Métricas personalizadas ───────────────────────────────────────────────────
const verificarTrend   = new Trend('verificar_condiciones_duration', true);
const verificarErrors  = new Rate('verificar_error_rate');
const verificarSuccess = new Counter('verificar_requests_ok');
const riegoActivado    = new Counter('verificar_riego_activado'); // cuántas veces se activó riego

// ── Escenarios ajustados para una operación pesada ────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'load';

const scenarios = {
  smoke: {
    smoke: { executor: 'constant-vus', vus: 1, duration: '30s', tags: { scenario: 'smoke' } },
  },
  load: {
    load_verificar: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 8 },
        { duration: '1m',  target: 8 },
        { duration: '10s', target: 0 },
      ],
      tags: { scenario: 'load' },
    },
  },
  stress: {
    stress_verificar: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 15 },
        { duration: '30s', target: 15 },
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
    // Operación compleja: BD + stored proc + posible MQTT
    verificar_condiciones_duration: ['p(95)<1000', 'p(99)<3000'],
    verificar_error_rate:           ['rate<0.01'],
    // El tiempo total incluyendo la activación del riego también debe estar acotado
    http_req_duration: ['p(95)<1500'],
  },
};

// ── IDs de plantas de usuario registradas (ajustar según BD) ─────────────────
const ID_PLANTAS_USUARIO = [1, 2, 3, 4, 5];

// ── Función principal ─────────────────────────────────────────────────────────
export default function () {
  const idPlanta = ID_PLANTAS_USUARIO[(__VU - 1) % ID_PLANTAS_USUARIO.length];

  // ── Caso 1: Verificación válida con planta existente ──────────────────────
  const resOk = http.post(
    `${BASE_URL}/api/verificar-condiciones`,
    JSON.stringify({ id_planta_usuario: idPlanta }),
    { headers: JSON_HEADERS, tags: { endpoint: 'verificar-condiciones', caso: 'id_valido' } }
  );

  verificarTrend.add(resOk.timings.duration);

  const okChecks = check(resOk, {
    '[verificar] status 200 con ID válido':                 (r) => r.status === 200,
    '[verificar] body contiene campo "ok"':                 (r) => {
      try { return 'ok' in JSON.parse(r.body); } catch { return false; }
    },
    '[verificar] body contiene campo "mensaje"':            (r) => {
      try { return typeof JSON.parse(r.body).mensaje === 'string'; } catch { return false; }
    },
    '[verificar] latencia < 1000ms':                        (r) => r.timings.duration < 1000,
  });

  // Registrar si el riego fue activado (umbral de humedad superado)
  if (resOk.status === 200) {
    try {
      const body = JSON.parse(resOk.body);
      if (body.mensaje && body.mensaje.includes('Riego automático activado')) {
        riegoActivado.add(1);
      }
    } catch (_) { /* ignorar errores de parseo */ }
  }

  verificarErrors.add(!okChecks);
  if (okChecks) verificarSuccess.add(1);

  sleep(1); // La verificación no debe hacerse muy frecuentemente

  // ── Caso 2: ID inválido (string) → debe rechazar con 400 ─────────────────
  const resInvalido = http.post(
    `${BASE_URL}/api/verificar-condiciones`,
    JSON.stringify({ id_planta_usuario: 'invalid' }),
    { headers: JSON_HEADERS, tags: { endpoint: 'verificar-condiciones', caso: 'id_invalido' } }
  );

  check(resInvalido, {
    '[verificar] rechaza ID inválido con 400':            (r) => r.status === 400,
    '[verificar] body ok=false en rechazo':               (r) => {
      try { return JSON.parse(r.body).ok === false; } catch { return false; }
    },
  });

  // ── Caso 3: Sin id_planta_usuario → debe rechazar con 400 ─────────────────
  const resSinId = http.post(
    `${BASE_URL}/api/verificar-condiciones`,
    JSON.stringify({}),
    { headers: JSON_HEADERS, tags: { endpoint: 'verificar-condiciones', caso: 'sin_id' } }
  );

  check(resSinId, {
    '[verificar] rechaza body vacío con 400':            (r) => r.status === 400,
  });

  sleep(1.5);
}

// ── Resumen de resultados ─────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'stdout': '\n[K6] Test de Verificar Condiciones completado. Ver resultados arriba.\n',
    '04_verificar_condiciones_summary.json': JSON.stringify(data, null, 2),
  };
}
