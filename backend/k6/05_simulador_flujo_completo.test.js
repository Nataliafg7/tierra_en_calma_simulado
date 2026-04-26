/**
 * =============================================================
 *  HU-SIMULADOR — Prueba de Rendimiento
 *  Funcionalidad: Generación y registro periódico de lecturas
 *                 de temperatura y humedad (flujo completo de telemetría)
 *
 *  Endpoints involucrados:
 *    POST /api/monitorear          → Activa el sensor para la planta
 *    GET  /api/datos               → Lee el último dato generado por el simulador
 *    GET  /api/historial           → Consulta el historial acumulado
 *    POST /api/verificar-condiciones → Valida umbrales T/H y dispara riego si es necesario
 *
 *  Descripción del flujo simulado:
 *    Este test representa el ciclo completo de telemetría del sistema:
 *      1. Un usuario activa el monitoreo de su planta (setSensorForPlanta).
 *      2. El simulador genera datos T/H periódicamente (internamente en el backend).
 *      3. El usuario consulta los datos más recientes (polling del dashboard).
 *      4. El sistema verifica las condiciones y decide si regar automáticamente.
 *
 *  Escenarios:
 *    Smoke  → 1 VU × 30 s
 *    Load   → 0→10 VU × 1 min  (flujo completo de varios usuarios)
 *    Stress → 0→20 VU × 30 s   (pico de usuarios activos simultáneamente)
 *
 *  Cómo ejecutar:
 *    k6 run -e SCENARIO=smoke  backend/k6/05_simulador_flujo_completo.test.js
 *    k6 run -e SCENARIO=load   backend/k6/05_simulador_flujo_completo.test.js
 *    k6 run -e SCENARIO=stress backend/k6/05_simulador_flujo_completo.test.js
 * =============================================================
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS, DEFAULT_THRESHOLDS } from './config.js';

// ── Métricas personalizadas por etapa del flujo ───────────────────────────────
const activacionTrend  = new Trend('flujo_activacion_duration',    true);
const lecturaTrend     = new Trend('flujo_lectura_duration',        true);
const historialTrend   = new Trend('flujo_historial_duration',      true);
const verificarTrend   = new Trend('flujo_verificar_duration',      true);
const flujoErrors      = new Rate('flujo_error_rate');
const flujoSuccess     = new Counter('flujo_completo_ok');

// ── Escenarios ────────────────────────────────────────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'load';

const scenarios = {
  smoke: {
    smoke: { executor: 'constant-vus', vus: 1, duration: '30s', tags: { scenario: 'smoke' } },
  },
  load: {
    load_flujo: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '1m',  target: 10 },
        { duration: '10s', target: 0  },
      ],
      tags: { scenario: 'load' },
    },
  },
  stress: {
    stress_flujo: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 20 },
        { duration: '30s', target: 20 },
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
    // Cada etapa del flujo tiene su propio umbral
    flujo_activacion_duration:  ['p(95)<600',  'p(99)<1500'],
    flujo_lectura_duration:     ['p(95)<100',  'p(99)<300' ],
    flujo_historial_duration:   ['p(95)<150',  'p(99)<400' ],
    flujo_verificar_duration:   ['p(95)<1000', 'p(99)<3000'],
    flujo_error_rate:           ['rate<0.01'],
  },
};

// ── Datos de prueba ───────────────────────────────────────────────────────────
const ID_PLANTAS_USUARIO = [1, 2, 3, 4, 5];

// ── Función principal (flujo completo por iteración) ─────────────────────────
export default function () {
  const idPlanta = ID_PLANTAS_USUARIO[(__VU - 1) % ID_PLANTAS_USUARIO.length];
  let flujoOk = true;

  // ─ ETAPA 1: Activar sensor / monitoreo ────────────────────────────────────
  group('Etapa 1: Activar monitoreo del sensor', () => {
    const res = http.post(
      `${BASE_URL}/api/monitorear`,
      JSON.stringify({ id_planta_usuario: idPlanta }),
      { headers: JSON_HEADERS, tags: { endpoint: 'monitorear', etapa: '1' } }
    );

    activacionTrend.add(res.timings.duration);

    const ok = check(res, {
      '[flujo/etapa1] monitorear responde 200':    (r) => r.status === 200,
      '[flujo/etapa1] sensor activado (ok=true)':  (r) => {
        try { return JSON.parse(r.body).ok === true; } catch { return false; }
      },
      '[flujo/etapa1] latencia < 600ms':           (r) => r.timings.duration < 600,
    });

    if (!ok) flujoOk = false;
    sleep(0.3);
  });

  // ─ ETAPA 2: Consultar última lectura generada por el simulador ─────────────
  group('Etapa 2: Leer última lectura T/H', () => {
    const res = http.get(
      `${BASE_URL}/api/datos`,
      { tags: { endpoint: 'datos', etapa: '2' } }
    );

    lecturaTrend.add(res.timings.duration);

    const ok = check(res, {
      '[flujo/etapa2] GET /api/datos responde 200':   (r) => r.status === 200,
      '[flujo/etapa2] body contiene campo "dato"':    (r) => {
        try { return 'dato' in JSON.parse(r.body); } catch { return false; }
      },
      '[flujo/etapa2] dato es un string T/H o espera': (r) => {
        try {
          const dato = JSON.parse(r.body).dato;
          return typeof dato === 'string' && dato.length > 0;
        } catch { return false; }
      },
      '[flujo/etapa2] latencia < 100ms':              (r) => r.timings.duration < 100,
    });

    if (!ok) flujoOk = false;
    sleep(0.2);
  });

  // ─ ETAPA 3: Consultar historial de lecturas registradas ───────────────────
  group('Etapa 3: Consultar historial de lecturas', () => {
    const res = http.get(
      `${BASE_URL}/api/historial`,
      { tags: { endpoint: 'historial', etapa: '3' } }
    );

    historialTrend.add(res.timings.duration);

    check(res, {
      '[flujo/etapa3] GET /api/historial responde 200':  (r) => r.status === 200,
      '[flujo/etapa3] historial es un arreglo':          (r) => {
        try { return Array.isArray(JSON.parse(r.body).historial); } catch { return false; }
      },
      '[flujo/etapa3] latencia < 150ms':                 (r) => r.timings.duration < 150,
    });

    sleep(0.3);
  });

  // ─ ETAPA 4: Verificar condiciones (umbral T/H + posible riego) ────────────
  group('Etapa 4: Verificar condiciones y umbrales T/H', () => {
    const res = http.post(
      `${BASE_URL}/api/verificar-condiciones`,
      JSON.stringify({ id_planta_usuario: idPlanta }),
      { headers: JSON_HEADERS, tags: { endpoint: 'verificar-condiciones', etapa: '4' } }
    );

    verificarTrend.add(res.timings.duration);

    const ok = check(res, {
      '[flujo/etapa4] verificar responde 200':          (r) => r.status === 200,
      '[flujo/etapa4] body contiene campo "ok"':        (r) => {
        try { return 'ok' in JSON.parse(r.body); } catch { return false; }
      },
      '[flujo/etapa4] body contiene "mensaje"':         (r) => {
        try { return typeof JSON.parse(r.body).mensaje === 'string'; } catch { return false; }
      },
      '[flujo/etapa4] latencia < 1000ms':               (r) => r.timings.duration < 1000,
    });

    if (!ok) flujoOk = false;
    sleep(0.5);
  });

  // ── Registrar si el flujo completo fue exitoso ────────────────────────────
  flujoErrors.add(!flujoOk);
  if (flujoOk) flujoSuccess.add(1);

  // Pausa entre iteraciones del flujo completo
  sleep(1);
}

// ── Resumen de resultados ─────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'stdout': '\n[K6] Test Flujo Completo completado. Ver resultados arriba.\n',
    '05_simulador_flujo_completo_summary.json': JSON.stringify(data, null, 2),
  };
}
