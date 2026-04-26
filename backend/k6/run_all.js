/**
 * =============================================================
 *  TIERRA EN CALMA — Script Maestro K6
 *  Archivo: k6/run_all.js
 *
 *  Ejecuta todas las funcionalidades críticas en un solo comando.
 *  Cada funcionalidad se mapea a un escenario con executor propio,
 *  permitiendo que corran de forma paralela o secuencial.
 *
 *  Cómo ejecutar:
 *    # Modo smoke completo (validación rápida ~30s)
 *    k6 run -e SCENARIO=smoke backend/k6/run_all.js
 *
 *    # Modo load completo (~2 min)
 *    k6 run -e SCENARIO=load backend/k6/run_all.js
 *
 *    # Contra staging
 *    k6 run -e K6_BASE_URL=https://mi-backend.railway.app \
 *           -e SCENARIO=load backend/k6/run_all.js
 *
 *    # Con reporte HTML (requiere k6-reporter o dashboard de Grafana)
 *    k6 run --out json=k6/results/all_results.json backend/k6/run_all.js
 * =============================================================
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS } from './config.js';

// ── Configuración global del escenario ────────────────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'smoke';

const STAGES = {
  smoke: [
    { duration: '30s', target: 1 },
  ],
  load: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 10 },
    { duration: '20s', target: 0  },
  ],
  stress: [
    { duration: '20s', target: 25 },
    { duration: '30s', target: 25 },
    { duration: '10s', target: 0  },
  ],
};

// Para smoke usamos constant-vus (arranca inmediatamente con 1 VU).
// Para load/stress usamos ramping-vus con rampas progresivas.
const SMOKE_OPTIONS = {
  executor: 'constant-vus',
  vus: 1,
  duration: '30s',
  tags: { suite: 'tierra_en_calma_all', scenario: 'smoke' },
};

const RAMP_OPTIONS = {
  executor: 'ramping-vus',
  startVUs: 1,           // ← empieza con 1 VU inmediatamente (no desde 0)
  stages: STAGES[SCENARIO] || STAGES.load,
  tags: { suite: 'tierra_en_calma_all', scenario: SCENARIO },
};

export const options = {
  scenarios: {
    todas_las_funcionalidades: SCENARIO === 'smoke' ? SMOKE_OPTIONS : RAMP_OPTIONS,
  },
  thresholds: {
    // SLA global de todo el sistema
    http_req_duration:  ['p(95)<1000', 'p(99)<3000'],
    http_req_failed:    ['rate<0.01'],

    // Por funcionalidad
    'http_req_duration{endpoint:contacto}':              ['p(95)<800'],
    'http_req_duration{endpoint:datos}':                 ['p(95)<100'],
    'http_req_duration{endpoint:historial}':             ['p(95)<150'],
    'http_req_duration{endpoint:monitorear}':            ['p(95)<600'],
    'http_req_duration{endpoint:verificar-condiciones}': ['p(95)<1000'],
  },
};

// ── Datos de prueba ───────────────────────────────────────────────────────────
const ID_PLANTAS_USUARIO = [1, 2, 3, 4, 5];

const CONTACTO_PAYLOADS = [
  { nombre: 'Ana García',   correo: 'ana@test.com',   mensaje: 'Consulta sobre riego' },
  { nombre: 'Luis Torres',  correo: 'luis@test.com',  mensaje: '¿Humedad óptima?' },
  { nombre: 'María López',  correo: 'maria@test.com', mensaje: 'Sensor no conecta' },
];

// ── Función principal: ejecuta todas las funcionalidades en cada iteración ────
export default function () {
  const idPlanta = ID_PLANTAS_USUARIO[(__VU - 1) % ID_PLANTAS_USUARIO.length];
  const contactoPayload = CONTACTO_PAYLOADS[(__VU - 1) % CONTACTO_PAYLOADS.length];

  // ══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 1: Formulario de Contacto
  // ══════════════════════════════════════════════════════════════════════════
  group('F1 — Formulario de Contacto', () => {
    const res = http.post(
      `${BASE_URL}/api/contacto`,
      JSON.stringify(contactoPayload),
      { headers: JSON_HEADERS, tags: { endpoint: 'contacto' } }
    );

    check(res, {
      '[F1] POST /api/contacto → 200':     (r) => r.status === 200,
      '[F1] latencia < 800ms':             (r) => r.timings.duration < 800,
    });

    // Validar rechazo de payload vacío
    const resVacio = http.post(
      `${BASE_URL}/api/contacto`,
      JSON.stringify({}),
      { headers: JSON_HEADERS, tags: { endpoint: 'contacto' } }
    );
    check(resVacio, {
      '[F1] payload vacío → 400':          (r) => r.status === 400,
    });

    sleep(0.3);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 2: Visualización de última lectura T/H
  // ══════════════════════════════════════════════════════════════════════════
  group('F2 — Última lectura de Temperatura y Humedad', () => {
    const resDatos = http.get(
      `${BASE_URL}/api/datos`,
      { tags: { endpoint: 'datos' } }
    );

    check(resDatos, {
      '[F2] GET /api/datos → 200':         (r) => r.status === 200,
      '[F2] body tiene campo "dato"':      (r) => {
        try { return 'dato' in JSON.parse(r.body); } catch { return false; }
      },
      '[F2] latencia < 100ms':             (r) => r.timings.duration < 100,
    });

    sleep(0.1);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 3: Registro periódico de lecturas (simulador → BD)
  // ══════════════════════════════════════════════════════════════════════════
  group('F3 — Registro de lecturas (activar sensor + historial)', () => {
    // Activar el sensor para la planta
    const resMonitorear = http.post(
      `${BASE_URL}/api/monitorear`,
      JSON.stringify({ id_planta_usuario: idPlanta }),
      { headers: JSON_HEADERS, tags: { endpoint: 'monitorear' } }
    );

    check(resMonitorear, {
      '[F3] POST /api/monitorear → 200':   (r) => r.status === 200,
      '[F3] ok=true en respuesta':         (r) => {
        try { return JSON.parse(r.body).ok === true; } catch { return false; }
      },
      '[F3] latencia < 600ms':             (r) => r.timings.duration < 600,
    });

    sleep(0.3);

    // Consultar el historial de lecturas registradas
    const resHistorial = http.get(
      `${BASE_URL}/api/historial`,
      { tags: { endpoint: 'historial' } }
    );

    check(resHistorial, {
      '[F3] GET /api/historial → 200':         (r) => r.status === 200,
      '[F3] historial es un arreglo':          (r) => {
        try { return Array.isArray(JSON.parse(r.body).historial); } catch { return false; }
      },
      '[F3] latencia < 150ms':                 (r) => r.timings.duration < 150,
    });

    sleep(0.2);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 4: Visualización de lecturas (ya cubierta en F2+F3)
  // Aquí se enfoca en el endpoint de datos en caliente
  // ══════════════════════════════════════════════════════════════════════════
  group('F4 — Visualización en tiempo real (polling)', () => {
    // Simular polling del dashboard: 3 lecturas rápidas
    for (let i = 0; i < 3; i++) {
      const res = http.get(
        `${BASE_URL}/api/datos`,
        { tags: { endpoint: 'datos' } }
      );

      check(res, {
        '[F4] polling → 200':               (r) => r.status === 200,
        '[F4] polling < 100ms':             (r) => r.timings.duration < 100,
      });

      sleep(0.1);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 5: Verificación manual de condiciones
  // ══════════════════════════════════════════════════════════════════════════
  group('F5 — Verificar condiciones manualmente', () => {
    const res = http.post(
      `${BASE_URL}/api/verificar-condiciones`,
      JSON.stringify({ id_planta_usuario: idPlanta }),
      { headers: JSON_HEADERS, tags: { endpoint: 'verificar-condiciones' } }
    );

    check(res, {
      '[F5] POST /api/verificar-condiciones → 200': (r) => r.status === 200,
      '[F5] body tiene campo "ok"':                 (r) => {
        try { return 'ok' in JSON.parse(r.body); } catch { return false; }
      },
      '[F5] body tiene campo "mensaje"':            (r) => {
        try { return typeof JSON.parse(r.body).mensaje === 'string'; } catch { return false; }
      },
      '[F5] latencia < 1000ms':                     (r) => r.timings.duration < 1000,
    });

    // Validar rechazo de ID inválido
    const resInvalido = http.post(
      `${BASE_URL}/api/verificar-condiciones`,
      JSON.stringify({ id_planta_usuario: 'no-es-numero' }),
      { headers: JSON_HEADERS, tags: { endpoint: 'verificar-condiciones' } }
    );

    check(resInvalido, {
      '[F5] ID inválido → 400':                     (r) => r.status === 400,
    });

    sleep(1);
  });

  // Pausa entre iteraciones completas del flujo
  sleep(0.5);
}

// ── Resumen final ─────────────────────────────────────────────────────────────
export function handleSummary(data) {
  // Calcular tasa de éxito global
  const totalChecks = data.metrics.checks;
  const passRate = totalChecks
    ? ((totalChecks.values.passes / (totalChecks.values.passes + totalChecks.values.fails)) * 100).toFixed(2)
    : 'N/A';

  console.log(`\n✅ Tasa de checks superados: ${passRate}%`);
  console.log(`📊 Requests totales: ${data.metrics.http_reqs?.values?.count ?? 'N/A'}`);
  console.log(`⏱  Duración p95:     ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) ?? 'N/A'} ms`);
  console.log(`❌ Tasa de errores:  ${((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)}%`);

  return {
    'stdout': `\n✅ Tasa de checks: ${passRate}% | 📊 Requests: ${data.metrics.http_reqs?.values?.count ?? 'N/A'} | ⏱ p95: ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) ?? 'N/A'} ms\n`,
    'run_all_summary.json': JSON.stringify(data, null, 2),
  };
}
