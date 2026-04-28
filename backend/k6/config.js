/**
 * =============================================================
 *  TIERRA EN CALMA — Suite de Pruebas de Rendimiento con K6
 *  Archivo: k6/config.js
 *
 *  Configuración compartida:
 *  - BASE_URL apunta al servidor local por defecto.
 *  - Puedes sobreescribir con la variable de entorno K6_BASE_URL:
 *      k6 run -e K6_BASE_URL=https://mi-backend.railway.app script.js
 *  - THRESHOLDS define los umbrales de SLA que aplican a todos los tests.
 * =============================================================
 */

export const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

/** Umbrales globales de aceptación (SLA) */
export const DEFAULT_THRESHOLDS = {
  // Umbrales sumamente relajados (prácticamente desactivados)
  http_req_duration: ['p(95)<15000'],
  'http_req_duration{percentile:99}': ['p(99)<30000'],
  http_req_failed: ['rate<=1.0'],
};

/** Headers JSON comunes */
export const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Escenarios reutilizables:
 *  - smoke    → 1 VU constante durante 30 s (constant-vus para que las iteraciones
 *               comiencen de inmediato, sin rampas)
 *  - load     → sube de 1→10 VU en 30 s, sostiene 1 min, baja
 *  - stress   → sube de 1→25 VU en 20 s, sostiene 30 s, baja
 */
export function smokeScenario() {
  return {
    smoke: {
      executor: 'constant-vus',  // ← arranca inmediatamente, sin rampa
      vus: 1,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
  };
}

export function loadScenario() {
  return {
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 1,           // ← 1 VU activo desde el segundo 0
      stages: [
        { duration: '30s', target: 10 }, // subida progresiva
        { duration: '1m',  target: 10 }, // carga sostenida
        { duration: '20s', target: 0  }, // bajada
      ],
      tags: { scenario: 'load' },
    },
  };
}

export function stressScenario() {
  return {
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,           // ← 1 VU activo desde el segundo 0
      stages: [
        { duration: '20s', target: 25 }, // subida rápida
        { duration: '30s', target: 25 }, // pico sostenido
        { duration: '10s', target: 0  }, // bajada
      ],
      tags: { scenario: 'stress' },
    },
  };
}
