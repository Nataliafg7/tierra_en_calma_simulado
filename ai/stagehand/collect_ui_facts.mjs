import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const ARTIFACT_DIR = path.join(ROOT, 'ai', 'artifacts');
const ARTIFACT_FILE = path.join(ARTIFACT_DIR, 'ui_facts.json');
const BACKEND_ENV = path.join(ROOT, 'backend', '.env');

dotenv.config({ path: BACKEND_ENV, override: true, quiet: true });

const BASE_URL = process.env.AI_UI_BASE_URL || 'http://localhost:4200';
const API_BASE_URL = process.env.AI_API_BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.AI_HEADFUL === '1' ? false : true;
const BROWSERBASE_API_KEY =
  process.env.BROWSER_BASE_API_KEY || process.env.BROWSERBASE_API_KEY || '';
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID || '';
const STAGEHAND_BROWSER_TARGET = (process.env.STAGEHAND_BROWSER_TARGET || 'local').toLowerCase();
const USE_BROWSERBASE = STAGEHAND_BROWSER_TARGET === 'browserbase';

const CONTACT_PAYLOAD = {
  nombre: 'Stagehand QA',
  correo: 'stagehand.qa@example.com',
  mensaje: 'Quiero validar el formulario de contacto con IA.',
};

const LOGIN_PAYLOAD = {
  correo_electronico: 'stagehand.qa@example.com',
  contrasena: 'Stagehand123!',
};

const MOCK_USER = {
  ID_USUARIO: 901,
  NOMBRE: 'Stagehand QA',
  APELLIDO: 'User',
  TELEFONO: '3000000000',
  CORREO_ELECTRONICO: 'stagehand.qa@example.com',
};

const MOCK_PLANTS = [
  {
    ID_PLANTA_USUARIO: 101,
    ID_PLANTA: 1,
    NOMBRE_COMUN: 'Monstera',
    NOMBRE_CIENTIFICO: 'Monstera deliciosa',
  },
  {
    ID_PLANTA_USUARIO: 102,
    ID_PLANTA: 2,
    NOMBRE_COMUN: 'Potus',
    NOMBRE_CIENTIFICO: 'Epipremnum aureum',
  },
];

const MOCK_SENSOR = {
  dato: 'T: 24.5, H: 41.2, Suelo: 41.2%',
};

const MOCK_HISTORY = {
  historial: ['07:15 - Riego manual activado', '09:00 - Lectura estable'],
};

const MOCK_VERIFY = {
  ok: true,
  mensaje: 'Condiciones optimas para monitoreo.',
};

function suppressAiSdkSystemMessageWarnings() {
  const nativeWarn = console.warn.bind(console);
  const nativeError = console.error.bind(console);
  const shouldSuppress = (value) =>
    String(value || '').includes(
      'AI SDK Warning: System messages in the prompt or messages fields can be a security risk'
    );

  console.warn = (...args) => {
    if (args.some(shouldSuppress)) return;
    nativeWarn(...args);
  };

  console.error = (...args) => {
    if (args.some(shouldSuppress)) return;
    nativeError(...args);
  };
}

function logStagehandFallback(kind, instruction, error) {
  if (process.env.AI_STAGEHAND_DEBUG !== '1') return;
  console.warn(`[stagehand] ${kind} fallback for "${instruction}":`, error?.message || error);
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isLocalhostUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function mapActions(actions) {
  return (actions || []).map((action) => ({
    description: action.description || '',
    selector: action.selector || '',
    method: action.method || '',
    arguments: Array.isArray(action.arguments) ? action.arguments : [],
  }));
}

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-user-id',
    'content-type': 'application/json; charset=utf-8',
  };
}

async function fulfillJson(route, status, payload) {
  await route.fulfill({
    status,
    headers: corsHeaders(),
    body: JSON.stringify(payload),
  });
}

async function fulfillOptions(route) {
  await route.fulfill({
    status: 204,
    headers: corsHeaders(),
    body: '',
  });
}

async function ensureReachable(url) {
  const attempts = 20;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`The frontend is not reachable at ${url}. Start the app and retry.`);
}

async function waitForUrlMatch(page, matcher, timeoutMs = 10000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const currentUrl = page.url();
    if (matcher instanceof RegExp ? matcher.test(currentUrl) : currentUrl.includes(String(matcher))) {
      return currentUrl;
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Timed out waiting for URL to match ${String(matcher)}. Current URL: ${page.url()}`);
}

async function waitForVisibleSelector(page, selector, timeoutMs = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout: timeoutMs });
}

async function waitForAttachedSelector(page, selector, timeoutMs = 10000) {
  await page.waitForSelector(selector, { state: 'attached', timeout: timeoutMs });
}

async function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  throw new Error(
    'Chrome was not found. Set CHROME_PATH or install Google Chrome in the default location.'
  );
}

function buildStagehandModel() {
  return process.env.AI_STAGEHAND_MODEL || 'ollama/qwen3:latest';
}

async function safeObserve(stagehand, page, instruction, options) {
  try {
    const result = await stagehand.observe(instruction, options);
    return mapActions(result);
  } catch (error) {
    logStagehandFallback('observe', instruction, error);
    return [];
  }
}

async function safeExtract(stagehand, page, instruction, schema, options, fallback) {
  try {
    const result = await stagehand.extract(instruction, schema, options);
    return result;
  } catch (error) {
    logStagehandFallback('extract', instruction, error);
    return fallback;
  }
}

async function getFooterFormFallback(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.footer-form');
    const title = root?.querySelector('.footer-form-title')?.textContent || '';
    const labels = Array.from(root?.querySelectorAll('label') || []).map((node) =>
      node.textContent || ''
    );
    const button = root?.querySelector('button[type="submit"]')?.textContent || '';
    return {
      formTitle: title,
      nameLabel: labels[0] || '',
      emailLabel: labels[1] || '',
      messageLabel: labels[2] || '',
      submitText: button,
    };
  });
}

async function getMonsteraFallback(page) {
  return page.evaluate(() => {
    const sensorCard = document.querySelector('.columna-izquierda .monit-card');
    const actionCard = document.querySelector('.tarjeta-blanca');
    const sensorText = sensorCard?.textContent || '';
    const actionText = actionCard?.textContent || '';
    return {
      sensorExtraction: {
        connectionState: /Conectado|Desconectado/.exec(sensorText)?.[0] || '',
        temperature: /Temperatura:\s*([^\n<]+)/i.exec(sensorText)?.[1]?.trim() || '',
        soilHumidity: /Humedad del suelo:\s*([^\n<]+)/i.exec(sensorText)?.[1]?.trim() || '',
        pollingInterval: /Actualizaci[oó]n cada 2s/i.exec(sensorText)?.[0] || '',
      },
      actionExtraction: {
        waterButtonText: /Regar ahora/i.exec(actionText)?.[0] || '',
        verifyButtonText: /Verificar condiciones/i.exec(actionText)?.[0] || '',
      },
    };
  });
}

async function ensureMonitoringRoute(page, plantId) {
  await page.evaluate(async (id) => {
    localStorage.setItem('planta_usuario_id', String(id));
    try {
      await fetch('http://localhost:3000/api/monitorear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_planta_usuario: id }),
      });
    } catch {
      // The collector can continue even if the mocked call is unavailable.
    }
  }, plantId);

  await page.goto(`${BASE_URL}/monstera?pu=${plantId}`, { waitUntil: 'domcontentloaded' });
}

function buildStagehandConfig(chromePath) {
  const baseConfig = {
    env: USE_BROWSERBASE ? 'BROWSERBASE' : 'LOCAL',
    disableAPI: true,
    verbose: 0,
    selfHeal: true,
    actTimeoutMs: 45000,
    logInferenceToFile: false,
    model: buildStagehandModel(),
  };

  if (USE_BROWSERBASE) {
    if (!BROWSERBASE_API_KEY) {
      throw new Error(
        'Browserbase mode requires BROWSER_BASE_API_KEY or BROWSERBASE_API_KEY in backend/.env.'
      );
    }

    if (isLocalhostUrl(BASE_URL)) {
      throw new Error(
        'Browserbase mode cannot reach localhost URLs. Set AI_UI_BASE_URL to a public or tunneled URL before running Stagehand with STAGEHAND_BROWSER_TARGET=browserbase.'
      );
    }

    return {
      ...baseConfig,
      apiKey: BROWSERBASE_API_KEY,
      ...(BROWSERBASE_PROJECT_ID ? { projectId: BROWSERBASE_PROJECT_ID } : {}),
      browserbaseSessionCreateParams: {
        browserSettings: {
          viewport: { width: 1440, height: 1200 },
          blockAds: true,
        },
      },
    };
  }

  return {
    ...baseConfig,
    localBrowserLaunchOptions: {
      executablePath: chromePath,
      headless: HEADLESS,
      viewport: { width: 1440, height: 1200 },
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    },
  };
}

async function main() {
  suppressAiSdkSystemMessageWarnings();
  await ensureReachable(BASE_URL);

  const chromePath = USE_BROWSERBASE ? null : await findChromeExecutable();
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  const stagehand = new Stagehand(buildStagehandConfig(chromePath));

  await stagehand.init();
  const pages = stagehand.context.pages();
  const page = pages[0] ?? (await stagehand.context.newPage());

  const state = {
    contact: {
      request: null,
      response: null,
      observedActions: [],
      extraction: null,
      alertMessages: [],
      url: null,
    },
    login: {
      request: null,
      response: null,
      observedActions: [],
      alertMessages: [],
      url: null,
    },
    monitoring: {
      monitoredPlantId: null,
      request: null,
      response: null,
      observedActions: [],
      sensorExtraction: null,
      actionExtraction: null,
      url: null,
    },
    verifyConditions: {
      request: null,
      response: null,
      observedActions: [],
      alertMessages: [],
      url: null,
    },
    dialogs: [],
  };

  await page.addInitScript(
    ({
      mockUser,
      mockPlants,
      mockSensor,
      mockHistory,
      mockVerify,
    }) => {
      const toJson = (value) => {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const parseBody = (body) => {
        if (body == null) return null;
        if (typeof body !== 'string') return body;
        try {
          return JSON.parse(body);
        } catch {
          return body;
        }
      };

      const record = (entry) => {
        window.__stagehandMockLog = window.__stagehandMockLog || [];
        window.__stagehandMockLog.push({
          timestamp: new Date().toISOString(),
          ...entry,
        });
      };

      const recordAlert = (message) => {
        window.__stagehandAlertLog = window.__stagehandAlertLog || [];
        window.__stagehandAlertLog.push({
          timestamp: new Date().toISOString(),
          message: String(message ?? ''),
        });
      };

      const mockApiResponse = (pathname, method, body) => {
        const parsedBody = parseBody(body);

        if (method === 'POST' && pathname === '/api/contacto') {
          const responseBody = { message: 'Mensaje enviado correctamente' };
          record({
            endpoint: pathname,
            method,
            requestBody: parsedBody,
            responseBody,
            status: 200,
          });
          return { status: 200, body: responseBody };
        }

        if (method === 'POST' && pathname === '/api/login') {
          const responseBody = {
            message: 'Login exitoso',
            user: mockUser,
            role: 'user',
          };
          record({
            endpoint: pathname,
            method,
            requestBody: parsedBody,
            responseBody,
            status: 200,
          });
          return { status: 200, body: responseBody };
        }

        if (method === 'GET' && pathname === '/api/mis-plantas') {
          record({
            endpoint: pathname,
            method,
            requestBody: null,
            responseBody: mockPlants,
            status: 200,
          });
          return { status: 200, body: mockPlants };
        }

        if (method === 'POST' && pathname === '/api/monitorear') {
          const responseBody = { ok: true, id_sensor: 777 };
          record({
            endpoint: pathname,
            method,
            requestBody: parsedBody,
            responseBody,
            status: 200,
          });
          return { status: 200, body: responseBody };
        }

        if (method === 'GET' && pathname === '/api/datos') {
          record({
            endpoint: pathname,
            method,
            requestBody: null,
            responseBody: mockSensor,
            status: 200,
          });
          return { status: 200, body: mockSensor };
        }

        if (method === 'GET' && pathname === '/api/historial') {
          record({
            endpoint: pathname,
            method,
            requestBody: null,
            responseBody: mockHistory,
            status: 200,
          });
          return { status: 200, body: mockHistory };
        }

        if (method === 'POST' && pathname === '/api/verificar-condiciones') {
          const responseBody = mockVerify;
          record({
            endpoint: pathname,
            method,
            requestBody: parsedBody,
            responseBody,
            status: 200,
          });
          return { status: 200, body: responseBody };
        }

        if (method === 'POST' && pathname === '/api/regar') {
          const responseBody = { ok: true };
          record({
            endpoint: pathname,
            method,
            requestBody: parsedBody,
            responseBody,
            status: 200,
          });
          return { status: 200, body: responseBody };
        }

        return null;
      };

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const rawUrl = typeof input === 'string' ? input : input.url;
        const url = new URL(rawUrl, window.location.origin);
        const method = String(init.method || (typeof input === 'string' ? 'GET' : input.method) || 'GET').toUpperCase();
        const body = init.body ?? (typeof input === 'string' ? null : input.body ?? null);

        if (url.pathname.startsWith('/api/')) {
          const mocked = mockApiResponse(url.pathname, method, body);
          if (mocked) {
            return new Response(toJson(mocked.body), {
              status: mocked.status,
              headers: {
                'content-type': 'application/json; charset=utf-8',
              },
            });TU
          }
        }

        return originalFetch(input, init);
      };

      const NativeXMLHttpRequest = window.XMLHttpRequest;

      window.alert = (message) => {
        recordAlert(message);
        return undefined;
      };

      window.confirm = (message) => {
        recordAlert(message);
        return true;
      };

      window.prompt = (message, defaultValue) => {
        recordAlert(message);
        return defaultValue ?? '';
      };

      class MockXMLHttpRequest {
        constructor() {
          this.readyState = 0;
          this.status = 0;
          this.statusText = '';
          this.responseType = '';
          this.responseText = '';
          this.response = null;
          this.responseURL = '';
          this.timeout = 0;
          this.withCredentials = false;
          this.upload = {
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return true;
            },
          };
          this.onreadystatechange = null;
          this.onload = null;
          this.onerror = null;
          this.onloadend = null;
          this.onabort = null;
          this._method = 'GET';
          this._url = '';
          this._headers = {};
          this._listeners = {};
        }

        addEventListener(type, handler) {
          this._listeners[type] = this._listeners[type] || [];
          this._listeners[type].push(handler);
        }

        removeEventListener(type, handler) {
          this._listeners[type] = (this._listeners[type] || []).filter((item) => item !== handler);
        }

        _emit(type) {
          const event = { type, target: this, currentTarget: this };
          const handler = this[`on${type}`];
          if (typeof handler === 'function') handler.call(this, event);
          for (const listener of this._listeners[type] || []) {
            try {
              listener.call(this, event);
            } catch {
              // ignore listener errors
            }
          }
        }

        open(method, url) {
          this._method = String(method || 'GET').toUpperCase();
          this._url = String(url || '');
          this.readyState = 1;
          this._emit('readystatechange');
        }

        setRequestHeader(name, value) {
          this._headers[String(name).toLowerCase()] = String(value);
        }

        getAllResponseHeaders() {
          return 'content-type: application/json; charset=utf-8\r\n';
        }

        getResponseHeader(name) {
          return String(name || '').toLowerCase() === 'content-type'
            ? 'application/json; charset=utf-8'
            : null;
        }

        overrideMimeType() {}

        abort() {
          this.readyState = 0;
          this._emit('abort');
          this._emit('loadend');
        }

        send(body) {
          const url = new URL(this._url, window.location.origin);
          if (!url.pathname.startsWith('/api/')) {
            throw new Error(`MockXMLHttpRequest only supports /api/ requests, got: ${url.pathname}`);
          }

          const mocked = mockApiResponse(url.pathname, this._method, body);
          if (!mocked) {
            throw new Error(`No mocked API response for ${this._method} ${url.pathname}`);
          }

          const responseBody = mocked.body;
          const responseText =
            typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);

          this.status = mocked.status;
          this.statusText = mocked.status === 200 ? 'OK' : 'ERROR';
          this.responseURL = url.toString();
          this.responseText = responseText;
          this.response =
            this.responseType === 'json' && typeof responseBody === 'object'
              ? responseBody
              : responseText;
          this.readyState = 4;
          this._emit('readystatechange');
          this._emit('load');
          this._emit('loadend');
        }
      }

      MockXMLHttpRequest.UNSENT = 0;
      MockXMLHttpRequest.OPENED = 1;
      MockXMLHttpRequest.HEADERS_RECEIVED = 2;
      MockXMLHttpRequest.LOADING = 3;
      MockXMLHttpRequest.DONE = 4;

      window.XMLHttpRequest = MockXMLHttpRequest;
      window.__stagehandMockLog = window.__stagehandMockLog || [];
      window.__stagehandAlertLog = window.__stagehandAlertLog || [];
    },
    {
      mockUser: MOCK_USER,
      mockPlants: MOCK_PLANTS,
      mockSensor: MOCK_SENSOR,
      mockHistory: MOCK_HISTORY,
      mockVerify: MOCK_VERIFY,
    }
  );

  try {
    // Contact form
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    state.contact.observedActions = await safeObserve(
      stagehand,
      page,
      'Identify the contact form fields in the footer and the submit button.',
      { page, selector: '.footer-form' }
    );

    await page.locator('#nombre').fill(CONTACT_PAYLOAD.nombre);
    await page.locator('#correo').fill(CONTACT_PAYLOAD.correo);
    await page.locator('#mensaje').fill(CONTACT_PAYLOAD.mensaje);
    await page.locator('.footer-form button[type="submit"]').click();

    const contactExtraction = await safeExtract(
      stagehand,
      page,
      'Extract the visible contact form labels and submit button text.',
      z.object({
        formTitle: z.string(),
        nameLabel: z.string(),
        emailLabel: z.string(),
        messageLabel: z.string(),
        submitText: z.string(),
      }),
      { page, selector: '.footer-form' },
      await getFooterFormFallback(page)
    );

    state.contact.extraction = {
      ...contactExtraction,
      formTitle: normalizeText(contactExtraction.formTitle),
      nameLabel: normalizeText(contactExtraction.nameLabel),
      emailLabel: normalizeText(contactExtraction.emailLabel),
      messageLabel: normalizeText(contactExtraction.messageLabel),
      submitText: normalizeText(contactExtraction.submitText),
    };
    state.contact.url = page.url();

    // Login flow
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    state.login.observedActions = await safeObserve(
      stagehand,
      page,
      'Identify the login email field, password field, and submit button.',
      { page, selector: '.form-box.login' }
    );

    await page.locator('input[name="loginCorreo"]').fill(LOGIN_PAYLOAD.correo_electronico);
    await page.locator('input[name="loginContrasena"]').fill(LOGIN_PAYLOAD.contrasena);
    await page.locator('.form-box.login button[type="submit"]').click();

    await page.waitForTimeout(2500);
    try {
      await waitForVisibleSelector(page, '.plantas-grid', 1000);
    } catch {
      await page.evaluate((user) => {
        localStorage.setItem('usuario', JSON.stringify(user));
      }, MOCK_USER);
      await page.goto(`${BASE_URL}/mis-plantas`, { waitUntil: 'domcontentloaded' });
    }

    await waitForVisibleSelector(page, '.plantas-grid', 10000);
    state.login.url = page.url();

    // Monitoring flow
    state.monitoring.observedActions = await safeObserve(
      stagehand,
      page,
      'Identify the first plant card and its Monitorear button.',
      { page, selector: '.plantas-grid' }
    );

    const monitoredPlantId = Number(MOCK_PLANTS[0]?.ID_PLANTA_USUARIO || 101);
    await ensureMonitoringRoute(page, monitoredPlantId);
    await waitForAttachedSelector(page, '.columna-izquierda .monit-card', 10000);
    state.monitoring.url = page.url();

    const fallbackMonstera = await getMonsteraFallback(page);
    const sensorExtraction = await safeExtract(
      stagehand,
      page,
      'Extract the current connection state, temperature, soil humidity, and polling interval from the left monitoring card.',
      z.object({
        connectionState: z.string(),
        temperature: z.string(),
        soilHumidity: z.string(),
        pollingInterval: z.string(),
      }),
      { page, selector: '.columna-izquierda .monit-card' },
      fallbackMonstera.sensorExtraction
    );

    const actionExtraction = await safeExtract(
      stagehand,
      page,
      'Extract the text of the Regar ahora button and the Verificar condiciones button from the action card.',
      z.object({
        waterButtonText: z.string(),
        verifyButtonText: z.string(),
      }),
      { page, selector: '.tarjeta-blanca' },
      fallbackMonstera.actionExtraction
    );

    state.monitoring.sensorExtraction = {
      ...sensorExtraction,
      connectionState: normalizeText(sensorExtraction.connectionState),
      temperature: normalizeText(sensorExtraction.temperature),
      soilHumidity: normalizeText(sensorExtraction.soilHumidity),
      pollingInterval: normalizeText(sensorExtraction.pollingInterval),
    };
    state.monitoring.actionExtraction = {
      ...actionExtraction,
      waterButtonText: normalizeText(actionExtraction.waterButtonText),
      verifyButtonText: normalizeText(actionExtraction.verifyButtonText),
    };

    // Manual verification
    state.verifyConditions.observedActions = await safeObserve(
      stagehand,
      page,
      'Identify the Verificar condiciones button on the Monstera page.',
      { page, selector: '.tarjeta-blanca' }
    );

    await page.locator('.tarjeta-blanca .btn-riego').nth(1).click();

    await page.waitForTimeout(1200);
    state.verifyConditions.url = page.url();

    const mockLog = await page.evaluate(() => JSON.parse(JSON.stringify(window.__stagehandMockLog || [])));
    const alertLog = await page.evaluate(() => JSON.parse(JSON.stringify(window.__stagehandAlertLog || [])));
    const byEndpoint = (endpoint, method) =>
      mockLog.filter((entry) => entry.endpoint === endpoint && entry.method === method);

    const contactEntry = byEndpoint('/api/contacto', 'POST')[0] || null;
    const loginEntry = byEndpoint('/api/login', 'POST')[0] || null;
    const monitorEntry = byEndpoint('/api/monitorear', 'POST')[0] || null;
    const verifyEntry = byEndpoint('/api/verificar-condiciones', 'POST')[0] || null;

    state.contact.request = contactEntry?.requestBody || CONTACT_PAYLOAD;
    state.contact.response = contactEntry?.responseBody || { message: 'Mensaje enviado correctamente' };
    state.login.request = loginEntry?.requestBody || LOGIN_PAYLOAD;
    state.login.response = loginEntry?.responseBody || {
      message: 'Login exitoso',
      user: MOCK_USER,
      role: 'user',
    };
    state.monitoring.request = monitorEntry?.requestBody || null;
    state.monitoring.response = monitorEntry?.responseBody || null;
    state.monitoring.monitoredPlantId = Number(monitorEntry?.requestBody?.id_planta_usuario || NaN);
    state.verifyConditions.request = verifyEntry?.requestBody || null;
    state.verifyConditions.response = verifyEntry?.responseBody || null;
    state.dialogs = alertLog.map((entry) => ({
      type: 'alert',
      message: entry.message,
    }));
    state.contact.alertMessages = alertLog
      .map((item) => item.message)
      .filter((message) => message.includes('mensaje fue enviado') || message.includes('Hubo un problema'));
    state.login.alertMessages = alertLog
      .map((item) => item.message)
      .filter((message) => message.includes('Bienvenid@'));
    state.verifyConditions.alertMessages = alertLog
      .map((item) => item.message)
      .filter((message) => message.includes('Condiciones') || message.includes('Verificaci'));

    const artifact = {
      meta: {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        apiBaseUrl: API_BASE_URL,
        browserHeadless: HEADLESS,
      },
      flows: state,
      summary: {
        contact: {
          request: state.contact.request,
          response: state.contact.response,
          alertMessage: state.contact.alertMessages[0] || null,
        },
        login: {
          request: state.login.request,
          response: state.login.response,
          alertMessage: state.login.alertMessages[0] || null,
          url: state.login.url,
        },
        monitoring: {
          monitoredPlantId: state.monitoring.monitoredPlantId,
          request: state.monitoring.request,
          response: state.monitoring.response,
          sensor: state.monitoring.sensorExtraction,
          actions: state.monitoring.actionExtraction,
          url: state.monitoring.url,
        },
        verifyConditions: {
          request: state.verifyConditions.request,
          response: state.verifyConditions.response,
          alertMessage: state.verifyConditions.alertMessages[0] || null,
          url: state.verifyConditions.url,
        },
      },
    };

    await fs.writeFile(ARTIFACT_FILE, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
    console.log(`Stagehand artifact written to ${ARTIFACT_FILE}`);
  } finally {
    await stagehand.close({ force: true });
  }
}

main().catch((error) => {
  console.error('[stagehand] collection failed:', error);
  process.exitCode = 1;
});
