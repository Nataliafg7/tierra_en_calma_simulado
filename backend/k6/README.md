# Pruebas de Rendimiento — K6

## Estructura de archivos

```
backend/k6/
├── config.js                          ← Configuración compartida (BASE_URL, thresholds, escenarios)
├── 01_contacto.test.js                ← F1: Formulario de contacto (POST /api/contacto)
├── 02_sensor_datos.test.js            ← F2+F4: Visualización T/H (GET /api/datos + /api/historial)
├── 03_monitorear.test.js              ← F3: Registro periódico de lecturas (POST /api/monitorear)
├── 04_verificar_condiciones.test.js   ← F5: Verificación manual (POST /api/verificar-condiciones)
├── 05_simulador_flujo_completo.test.js ← Flujo E2E: todas las etapas en secuencia
├── run_all.js                         ← Script maestro: todas las funcionalidades en un solo run
└── results/                           ← (auto-generado) Reportes JSON de cada ejecución
```

---

## Requisitos previos

1. **K6 instalado** — ya instalado automáticamente via `winget`.  
   Verifica con:
   ```powershell
   k6 version
   ```

2. **Servidor backend corriendo** en `http://localhost:3000`:
   ```powershell
   cd backend
   node server.js
   ```

3. *(Opcional)* **Variables de entorno** para apuntar a staging/producción:
   ```powershell
   $env:K6_BASE_URL = "https://mi-backend.up.railway.app"
   ```

---

## Comandos de ejecución

### Ejecutar todas las funcionalidades (script maestro)

```powershell
# Smoke — validación rápida (~30 s)
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
k6 run -e SCENARIO=smoke backend/k6/run_all.js

# Load — carga normal (~2 min)
k6 run -e SCENARIO=load backend/k6/run_all.js

# Stress — pico de tráfico (~1 min)
k6 run -e SCENARIO=stress backend/k6/run_all.js
```

### Ejecutar funcionalidades individualmente

```powershell
# F1 — Formulario de Contacto
k6 run -e SCENARIO=load backend/k6/01_contacto.test.js

# F2+F4 — Visualización de Temperatura y Humedad (endpoints en memoria)
k6 run -e SCENARIO=load backend/k6/02_sensor_datos.test.js

# F3 — Registro periódico de lecturas (requiere BD Oracle activa)
k6 run -e SCENARIO=load backend/k6/03_monitorear.test.js

# F5 — Verificación manual de condiciones (requiere BD Oracle activa)
k6 run -e SCENARIO=load backend/k6/04_verificar_condiciones.test.js

# Flujo E2E — Todas las etapas en secuencia
k6 run -e SCENARIO=load backend/k6/05_simulador_flujo_completo.test.js
```

### Contra staging/producción

```powershell
k6 run -e K6_BASE_URL=https://mi-backend.up.railway.app `
       -e SCENARIO=load `
       backend/k6/run_all.js
```

### Con reporte JSON

```powershell
k6 run --out json=backend/k6/results/raw_metrics.json `
       -e SCENARIO=load `
       backend/k6/run_all.js
```

---

## Escenarios disponibles

| Escenario | VUs | Duración | Propósito |
|-----------|-----|----------|-----------|
| `smoke`  | 1   | 30 s     | Validar que el endpoint responde sin errores básicos |
| `load`   | 0→10 VU | ~2 min  | Simular carga normal de usuarios concurrentes |
| `stress` | 0→25 VU | ~1 min  | Simular un pico de tráfico inesperado |

---

## Umbrales de aceptación (SLA)

| Endpoint | p95 | p99 | Error rate |
|----------|-----|-----|------------|
| `POST /api/contacto` | < 800ms | < 2000ms | < 1% |
| `GET /api/datos` | < 100ms | < 300ms | < 1% |
| `GET /api/historial` | < 150ms | < 400ms | < 1% |
| `POST /api/monitorear` | < 600ms | < 1500ms | < 1% |
| `POST /api/verificar-condiciones` | < 1000ms | < 3000ms | < 1% |
| **Global** | < 500ms | < 1500ms | < 1% |

> **Nota:** Los umbrales de `/api/contacto` son más altos porque en producción
> el endpoint envía un correo real vía SMTP. En entorno de test/mock el tiempo
> será mucho menor.

> **Nota:** Los umbrales de `/api/monitorear` y `/api/verificar-condiciones`
> son más altos porque involucran consultas a Oracle DB (y stored procedures).

---

## Interpretación de resultados

Después de cada ejecución K6 mostrará una tabla como esta:

```
          /\      Grafana   /‾‾/  
     /\  /  \     |\  __   /  /   
    /  \/    \    | |/ /  /   ‾‾\ 
   /          \   |   (  |  (‾)  |
  / __________ \  |_|\_\  \_____/ 

  scenarios: (100.00%) 1 scenario, 10 max VUs, 2m30s max duration

  ✓ [F1] POST /api/contacto → 200
  ✓ [F2] GET /api/datos → 200
  ✓ [F3] POST /api/monitorear → 200
  ✗ [F5] latencia < 1000ms   ← si falla, el backend está lento

  checks.........................: 98.7%  ✓ 2367  ✗ 31
  data_received..................: 1.2 MB 8.0 kB/s
  http_req_duration...............: avg=210ms  min=5ms  med=180ms  max=2.4s  p(90)=450ms  p(95)=680ms
  http_req_failed................: 0.12%  ✓ 3      ✗ 2490
```

### ¿Qué buscar?

- **`✓` checks** → el endpoint responde correctamente bajo carga.
- **`✗` checks** → hubo fallos de validación (status inesperado o latencia alta).
- **`http_req_duration p(95)`** → debe estar por debajo del umbral definido.
- **`http_req_failed rate`** → debe ser < 1%.
- Si aparece `✗ [threshold: ...]` al final, el SLA fue incumplido.

---

## Configuración avanzada

### Cambiar la URL base

```powershell
k6 run -e K6_BASE_URL=http://localhost:4000 backend/k6/run_all.js
```

### Añadir IDs de planta reales

Edita el array `ID_PLANTAS_USUARIO` en cada script con los IDs que existan
en tu base de datos Oracle:

```js
// backend/k6/03_monitorear.test.js
const ID_PLANTAS_USUARIO = [101, 102, 103]; // IDs reales en tu BD
```

### Exportar a Grafana / InfluxDB

```powershell
k6 run --out influxdb=http://localhost:8086/k6 backend/k6/run_all.js
```
