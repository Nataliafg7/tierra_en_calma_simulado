import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('MonsteraComponent - activarRiego()', () => {

  let component: MonsteraComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [
        MonsteraComponent,
        HttpClientTestingModule
      ],
      providers: [
        MqttDataService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    component = fixture.componentInstance;

    httpMock = TestBed.inject(HttpTestingController);

  });

  afterEach(() => {
    httpMock.verify();
  });

  // Helper: precargar historial con N registros (para escenarios del límite 10)
  function precargarHistorial(n: number) {
    for (let i = 0; i < n; i++) {
      component.historialRiego.push({
        tipo: 'manual',
        mensaje: `Registro antiguo #${i + 1}`,
        hora: `00:00:${String(i).padStart(2, '0')}`,
      });
    }
  }

  // Escenario P2 — Respuesta exitosa
  it('P2 — Debe activar riego y registrar evento en historial', () => {

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');

    expect(req.request.method).toBe('POST');

    req.flush({ ok: true });

    expect(component.historialRiego.length).toBe(1);
    expect(component.historialRiego[0].tipo).toBe('manual');
    expect(component.historialRiego[0].mensaje).toBe('Riego manual activado');

  });

  // Escenario P1 — Error en backend
  it('P1 — Debe manejar error si falla la activación del riego', () => {

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');

    expect(req.request.method).toBe('POST');

    req.flush(
      { ok: false },
      { status: 500, statusText: 'Server Error' }
    );

    expect(component.historialRiego.length).toBe(0);

  });

  // HDEU: Registro automático del evento de riego en el historial

  // Escenario 1 — Error en el servicio de riego
  // Condición: el servicio falla
  // Resultado esperado: NO agrega registro al historial
  
  it('HDEU Escenario 1 — Si falla el servicio, NO agrega registro al historial', () => {

    precargarHistorial(2);
    const sizeBefore = component.historialRiego.length;

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush(
      { ok: false },
      { status: 500, statusText: 'Server Error' }
    );

    expect(component.historialRiego.length).toBe(sizeBefore);

  });

  // Escenario 2 — Éxito y el historial NO supera 10 registros
  // Condición: éxito y tamaño previo <= 9 (para quedar en 10)
  // Resultado esperado: agrega, NO elimina, queda <= 10

  it('HDEU Escenario 2 — En éxito agrega registro y NO elimina si queda en <= 10', () => {

    precargarHistorial(9);
    const lastBefore = component.historialRiego[component.historialRiego.length - 1];

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    expect(req.request.method).toBe('POST');

    req.flush({ ok: true });

    // queda en 10
    expect(component.historialRiego.length).toBe(10);

    // nuevo al inicio
    expect(component.historialRiego[0].tipo).toBe('manual');
    expect(component.historialRiego[0].mensaje).toBe('Riego manual activado');

    // NO eliminó el último anterior
    const lastAfter = component.historialRiego[component.historialRiego.length - 1];
    expect(lastAfter.mensaje).toBe(lastBefore.mensaje);
    expect(lastAfter.hora).toBe(lastBefore.hora);

  });

  // Escenario 3 — Éxito y el historial supera 10 registros
  // Condición: éxito y tamaño previo = 10
  // Resultado esperado: agrega, hace pop, queda en 10

  it('HDEU Escenario 3 — En éxito elimina el registro más antiguo si supera 10', () => {

    precargarHistorial(10);
    const oldestBefore = component.historialRiego[component.historialRiego.length - 1];

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    expect(req.request.method).toBe('POST');

    req.flush({ ok: true });

    // mantiene máximo 10
    expect(component.historialRiego.length).toBe(10);

    // nuevo al inicio
    expect(component.historialRiego[0].mensaje).toBe('Riego manual activado');

    // el más antiguo ya no existe (pop)
    const stillExists = component.historialRiego.some(
      (x) => x.mensaje === oldestBefore.mensaje && x.hora === oldestBefore.hora
    );
    expect(stillExists).toBe(false);

  });

  // NUEVAS PRUEBAS — Actualización de lecturas ambientales (cargarDatos)

  // Helper: ejecutar cargarDatos (private) + responder /historial
  function ejecutarCargarDatosYResponderHistorial(hist: string[] = []) {
    (component as any).cargarDatos();
    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHist.request.method).toBe('GET');
    reqHist.flush({ historial: hist });
  }

  // Escenario 1 (P1) — Respuesta inválida, se omite procesamiento
  // Condición: res no existe o res.dato inválido
  // Resultado: no actualiza UI ni puntos; espera siguiente intervalo

  it('Lecturas P1 — Si /datos retorna res inválido, NO actualiza UI ni puntos', () => {
    // Arrange (estado base)
    const uiBefore = component.realtimeData;
    const connectedBefore = component.isConnected;
    const tempBefore = component.sensorData.temperatura;
    const sueloBefore = component.sensorData.humedadSuelo;

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');

    // Respuesta inválida (sin dato)
    reqDatos.flush({});

    // /historial siempre se consulta también
    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHist.request.method).toBe('GET');
    reqHist.flush({ historial: ['x'] });

    // Assert: UI no cambia
    expect(component.realtimeData).toBe(uiBefore);
    expect(component.isConnected).toBe(connectedBefore);
    expect(component.sensorData.temperatura).toBe(tempBefore);
    expect(component.sensorData.humedadSuelo).toBe(sueloBefore);

    // Assert: no puntos (private arrays)
    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);

    // Assert: historial sí se actualiza por el segundo GET
    expect(component.historial).toEqual(['x']);
  });

  // Escenario 2 (P2) — Respuesta válida, pero NO tempMatch y NO sueloMatch
  // Condición: dato sin patrones T ni H
  // Resultado: actualiza UI base, pero NO agrega puntos

  it('Lecturas P2 — Dato válido sin regex: actualiza UI, NO agrega puntos', () => {
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'LECTURA_SIN_T_NI_H' });

    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHist.flush({ historial: [] });

    expect(component.realtimeData).toBe('LECTURA_SIN_T_NI_H');
    expect(component.isConnected).toBe(true);
    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('---');

    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);
  });

  // Escenario 3 (P3) — tempMatch SÍ, sueloMatch NO
  // Resultado: agrega punto de temperatura, no de humedad

  it('Lecturas P3 — Solo T: agrega punto temp, NO agrega humedad', () => {
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'T: 25.5' });

    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHist.flush({ historial: [] });

    expect(component.sensorData.temperatura).toBe('25.5 °C');
    expect(component.sensorData.humedadSuelo).toBe('---');

    expect((component as any).tempData.length).toBe(1);
    expect((component as any).tempData[0]).toBeCloseTo(25.5, 5);

    expect((component as any).humidityData.length).toBe(0);
  });

  // Escenario 4 (P4) — tempMatch NO, sueloMatch SÍ y NO dispara riego
  // Condición: H existe y h >= 30
  // Resultado: agrega humedad, NO riego automático

  it('Lecturas P4 — Solo H (>=30): agrega humedad, NO ejecuta riego automático', () => {
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'H: 40' });

    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHist.flush({ historial: [] });

    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('40%');

    expect((component as any).humidityData.length).toBe(1);
    expect((component as any).humidityData[0]).toBeCloseTo(40, 5);

    // No debe registrar riego automático
    expect(component.historialRiego.length).toBe(0);
  });

  // Escenario 5 (P5) — tempMatch SÍ, sueloMatch SÍ y NO dispara riego
  // Condición: h >= 30
  // Resultado: agrega ambos puntos, NO riego automático

  it('Lecturas P5 — T y H (>=30): agrega temp y humedad, NO ejecuta riego automático', () => {
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'T: 21.2 H: 35' });

    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHist.flush({ historial: [] });

    expect(component.sensorData.temperatura).toBe('21.2 °C');
    expect(component.sensorData.humedadSuelo).toBe('35%');

    expect((component as any).tempData.length).toBe(1);
    expect((component as any).humidityData.length).toBe(1);

    expect(component.historialRiego.length).toBe(0);
  });

  // ---------------------------------------------------------
  // Escenario 6 (P6) — sueloMatch SÍ y h < 30 dispara riego automático
  // Resultado: ejecuta riego automático y registra en historialRiego
  // ---------------------------------------------------------
  it('Lecturas P6 — H (<30): ejecuta riego automático y registra evento automático', () => {
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'T: 20 H: 25' });

    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHist.flush({ historial: [] });

    // Puntos agregados
    expect((component as any).tempData.length).toBe(1);
    expect((component as any).humidityData.length).toBe(1);

    // Riego automático ejecutado: agrega historialRiego al inicio
    expect(component.historialRiego.length).toBe(1);
    expect(component.historialRiego[0].tipo).toBe('automático');
    expect(component.historialRiego[0].mensaje).toBe('Riego automático ejecutado');
  });

    // =====================================================================
  // NUEVAS PRUEBAS — Registro de cuidados (guardarCuidado)
  // =====================================================================

  // Helper: esperar a que se resuelvan promesas del .then/.catch de fetch
  function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  let originalFetch: any;

  beforeEach(() => {
    // Guardar fetch original para restaurar luego
    originalFetch = (globalThis as any).fetch;
  });

  afterEach(() => {
    // Restaurar fetch original
    (globalThis as any).fetch = originalFetch;
  });

  // ---------------------------------------------------------
  // Escenario 1 — Error en localStorage
  // Condición: idPU no es entero y localStorage también inválido
  // Resultado esperado: fallback a localStorage, luego error de ID (no hay POST)
  // ---------------------------------------------------------
  it('Cuidados Escenario 1 — ID inválido y localStorage inválido: NO hace POST y NO limpia formulario', () => {
    // Arrange
    (component as any).idPlantaUsuario = null; // fuerza fallback
    localStorage.setItem('planta_usuario_id', 'abc'); // inválido

    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Riego', detalles: 'x' };

    // Si llegara a hacer fetch, debe fallar el test
    (globalThis as any).fetch = () => {
      throw new Error('No debería llamar fetch en este escenario');
    };

    // Act
    component.guardarCuidado();

    // Assert: no limpia formulario
    expect(component.nuevoCuidado.fecha).toBe('2026-03-04');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('Riego');
    expect(component.nuevoCuidado.detalles).toBe('x');
  });

  // ---------------------------------------------------------
  // Escenario 2 — ID inválido
  // Condición: ID existe pero no cumple validación (no entero)
  // Resultado esperado: Error ID (no hay POST)
  // ---------------------------------------------------------
  it('Cuidados Escenario 2 — ID no entero: NO hace POST y NO limpia formulario', () => {
    // Arrange
    (component as any).idPlantaUsuario = 1.5 as any; // inválido (no entero)
    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Poda', detalles: 'x' };

    (globalThis as any).fetch = () => {
      throw new Error('No debería llamar fetch en este escenario');
    };

    // Act
    component.guardarCuidado();

    // Assert
    expect(component.nuevoCuidado.fecha).toBe('2026-03-04');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('Poda');
  });

  // ---------------------------------------------------------
  // Escenario 3 — Fecha inválida
  // Condición: fecha vacía o no convertible a ISO
  // Resultado esperado: Error fecha (no hay POST)
  // ---------------------------------------------------------
  it('Cuidados Escenario 3 — Fecha inválida: NO hace POST y NO limpia formulario', () => {
    // Arrange
    (component as any).idPlantaUsuario = 10; // válido
    component.nuevoCuidado = { fecha: '', tipo_cuidado: 'Fertilización', detalles: 'x' };

    (globalThis as any).fetch = () => {
      throw new Error('No debería llamar fetch en este escenario');
    };

    // Act
    component.guardarCuidado();

    // Assert
    expect(component.nuevoCuidado.fecha).toBe('');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('Fertilización');
  });

  // ---------------------------------------------------------
  // Escenario 4 — Tipo inválido
  // Nota: en tu código actual “tipo inválido” = vacío/solo espacios (no hay catálogo)
  // Resultado esperado: Error tipo (no hay POST)
  // ---------------------------------------------------------
  it('Cuidados Escenario 4 — Tipo vacío/espacios: NO hace POST y NO limpia formulario', () => {
    // Arrange
    (component as any).idPlantaUsuario = 10; // válido
    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: '   ', detalles: 'x' };

    (globalThis as any).fetch = () => {
      throw new Error('No debería llamar fetch en este escenario');
    };

    // Act
    component.guardarCuidado();

    // Assert
    expect(component.nuevoCuidado.fecha).toBe('2026-03-04');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('   ');
  });

  // ---------------------------------------------------------
  // Escenario 5 — Error en POST
  // Condición: backend responde ok=false / status != 200
  // Resultado esperado: lanza excepción en then y cae al catch; NO limpia formulario
  // ---------------------------------------------------------
  it('Cuidados Escenario 5 — POST falla: NO limpia formulario', async () => {
    // Arrange
    (component as any).idPlantaUsuario = 10;
    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Poda', detalles: 'detalle' };

    // Respuesta simulada de fetch con error
    (globalThis as any).fetch = () =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve('Error backend'),
        json: () => Promise.resolve({}),
      });

    // Act
    component.guardarCuidado();
    await flushPromises();

    // Assert: NO se limpió el formulario
    expect(component.nuevoCuidado.fecha).toBe('2026-03-04');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('Poda');
    expect(component.nuevoCuidado.detalles).toBe('detalle');
  });

  // ---------------------------------------------------------
  // Escenario 6 — Flujo exitoso
  // Condición: datos válidos y backend ok=true
  // Resultado esperado: confirma operación y limpia formulario
  // ---------------------------------------------------------
  it('Cuidados Escenario 6 — POST exitoso: limpia formulario', async () => {
    // Arrange
    (component as any).idPlantaUsuario = 10;
    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Riego', detalles: 'algo' };

    // Respuesta simulada exitosa
    (globalThis as any).fetch = () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
        text: () => Promise.resolve(''),
      });

    // Act
    component.guardarCuidado();
    await flushPromises();

    // Assert: formulario limpio
    expect(component.nuevoCuidado).toEqual({ fecha: '', tipo_cuidado: '', detalles: '' });
  });

});