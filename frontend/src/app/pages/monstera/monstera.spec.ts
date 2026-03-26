import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

// ─── helpers ────────────────────────────────────────────────────────────────
function buildRoute(puValue: string | null) {
  return { snapshot: { queryParamMap: { get: () => puValue } } };
}

// Ruta que fuerza el fallback a localStorage (Number('abc') = NaN, no es integer)
function buildRouteNoId() {
  return { snapshot: { queryParamMap: { get: () => 'abc' } } };
}

// Helper para el route sin ID usando null (usado por suites HTTP)
const routeNullId = {
  snapshot: { queryParamMap: { get: () => null } }
};

// Función utilidad para consumir promesas pendientes
async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

// ─── Suite principal - MqttDataService spy (coverage de ramas) ──────────────
describe('MonsteraComponent', () => {
  let component: MonsteraComponent;
  let fixture: ComponentFixture<MonsteraComponent>;
  let mqttSpy: jasmine.SpyObj<MqttDataService>;
  let fetchSpy: jasmine.Spy;

  beforeEach(async () => {
    mqttSpy = jasmine.createSpyObj('MqttDataService', ['getUltimoDato', 'getHistorial', 'activarRiego']);
    mqttSpy.getUltimoDato.and.returnValue(of({ dato: 'T:25.0,H:40.0%' }));
    mqttSpy.getHistorial.and.returnValue(of({ historial: ['T:25,H:40%'] }));
    mqttSpy.activarRiego.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        { provide: MqttDataService, useValue: mqttSpy },
        { provide: ActivatedRoute, useValue: buildRoute('99') }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MonsteraComponent);
    component = fixture.componentInstance;

    fetchSpy = spyOn(window, 'fetch').and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ mensaje: 'Condiciones verificadas' })
    }) as any);

    spyOn(localStorage, 'getItem').and.returnValue('99');
    spyOn(localStorage, 'setItem');
    spyOn(window, 'alert');
    spyOn(console, 'error');
    spyOn(console, 'warn');
    spyOn(console, 'log');

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // ─── creation ─────────────────────────────────────────────────────────────

  it('should create and load initial data properly', () => {
    expect(component).toBeTruthy();
    expect(mqttSpy.getUltimoDato).toHaveBeenCalled();
    expect(component.isConnected).toBeTrue();
  });

  // ─── activarRiego (MQTTSpy) ───────────────────────────────────────────────

  it('should activate riego manually and prompt success', () => {
    component.activarRiego();
    expect(mqttSpy.activarRiego).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Riego activado correctamente');
  });

  it('should handle activarRiego errors', () => {
    mqttSpy.activarRiego.and.returnValue(throwError(() => new Error('Error Mqtt')));
    component.activarRiego();
    expect(window.alert).toHaveBeenCalledWith('Error al activar el riego');
  });

  // ─── verificarCondiciones ──────────────────────────────────────────────────

  it('should call fetch on verificarCondiciones when id is valid', fakeAsync(() => {
    component.verificarCondiciones();
    expect(fetchSpy).toHaveBeenCalled();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Condiciones verificadas');
  }));

  it('should show fallback message when result.mensaje is absent', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}) // no "mensaje"
    }) as any);

    component.verificarCondiciones();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Verificación completada');
  }));

  it('should alert error when verificarCondiciones fetch rejects', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.reject(new Error('Red caída')));

    component.verificarCondiciones();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Error al verificar las condiciones');
  }));

  // ─── guardarCuidado — validaciones ────────────────────────────────────────

  it('should validate missing fecha', () => {
    component.nuevoCuidado = { fecha: '', tipo_cuidado: '', detalles: '' };
    component.guardarCuidado();
    expect(window.alert).toHaveBeenCalledWith('Falta fecha (YYYY-MM-DD)');
  });

  it('should validate missing tipo_cuidado', () => {
    component.nuevoCuidado = { fecha: '2023-10-10', tipo_cuidado: '   ', detalles: '' };
    component.guardarCuidado();
    expect(window.alert).toHaveBeenCalledWith('Falta tipo de cuidado');
  });

  it('should POST care record when all fields are valid and show success', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }) as any);

    component.nuevoCuidado = { fecha: '2023-10-10', tipo_cuidado: 'podar', detalles: 'd' };
    component.guardarCuidado();

    expect(fetchSpy).toHaveBeenCalled();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Cuidado guardado:\npodar el 2023-10-10');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('');
  }));

  it('should handle non-ISO fecha format and normalize it', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }) as any);

    component.nuevoCuidado = { fecha: '10/10/2023', tipo_cuidado: 'abono', detalles: '' };
    component.guardarCuidado();
    tick();
    expect(fetchSpy).toHaveBeenCalled();
  }));

  it('should alert error when guardarCuidado fetch fails (not ok)', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.resolve({
      ok: false,
      text: () => Promise.resolve('Server Error')
    }) as any);

    component.nuevoCuidado = { fecha: '2023-10-10', tipo_cuidado: 'podar', detalles: '' };
    component.guardarCuidado();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Error guardando el cuidado');
  }));

  it('should alert error when guardarCuidado fetch rejects completely', fakeAsync(() => {
    fetchSpy.and.returnValue(Promise.reject(new Error('Sin red')));

    component.nuevoCuidado = { fecha: '2023-10-10', tipo_cuidado: 'podar', detalles: '' };
    component.guardarCuidado();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Error guardando el cuidado');
  }));
});

// ─── Suite separada: ngOnInit con fallback a localStorage ───────────────────
describe('MonsteraComponent — ngOnInit fallbacks', () => {
  let mqttSpy: jasmine.SpyObj<MqttDataService>;

  beforeEach(() => {
    mqttSpy = jasmine.createSpyObj('MqttDataService', ['getUltimoDato', 'getHistorial', 'activarRiego']);
    mqttSpy.getUltimoDato.and.returnValue(of({ dato: 'T:25.0,H:40.0%' }));
    mqttSpy.getHistorial.and.returnValue(of({ historial: [] }));
    mqttSpy.activarRiego.and.returnValue(of({}));
  });

  async function createWithRoute(route: any, localStorageValue: string | null) {
    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        { provide: MqttDataService, useValue: mqttSpy },
        { provide: ActivatedRoute, useValue: route }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    spyOn(window, 'fetch').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as any);
    spyOn(localStorage, 'getItem').and.returnValue(localStorageValue);
    spyOn(localStorage, 'setItem');
    spyOn(window, 'alert');
    spyOn(console, 'error');
    spyOn(console, 'warn');
    spyOn(console, 'log');

    (component as any).ensureChart = jasmine.createSpy('ensureChart');
    fixture.detectChanges();

    return { component, fixture };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should use localStorage fallback when queryParam is not an integer', async () => {
    const { component } = await createWithRoute(buildRouteNoId(), '99');
    expect(localStorage.getItem).toHaveBeenCalledWith('planta_usuario_id');
    expect(component.isConnected).toBeTrue();
    component.ngOnDestroy();
  });

  it('should alert and return early when neither queryParam nor localStorage has valid id', async () => {
    const { component } = await createWithRoute(buildRouteNoId(), null);
    expect(window.alert).toHaveBeenCalledWith('No hay planta seleccionada para monitoreo.');
    component.ngOnDestroy();
  });

  it('should alert Falta ID de planta when verificarCondiciones called with null id', async () => {
    const { component } = await createWithRoute(buildRouteNoId(), null);
    (window.alert as jasmine.Spy).calls.reset();
    component.verificarCondiciones();
    expect(window.alert).toHaveBeenCalledWith('Falta ID de planta');
    component.ngOnDestroy();
  });

  it('should alert Falta id_planta_usuario when guardarCuidado called with null id', async () => {
    const { component } = await createWithRoute(buildRouteNoId(), null);
    (window.alert as jasmine.Spy).calls.reset();
    (component as any).idPlantaUsuario = null;
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);
    component.nuevoCuidado = { fecha: '2023-10-10', tipo_cuidado: 'riego', detalles: '' };
    component.guardarCuidado();
    expect(window.alert).toHaveBeenCalledWith('Falta id_planta_usuario');
    component.ngOnDestroy();
  });
});

// ─── Suite separada: cargarDatos edge cases (MqttSpy) ───────────────────────
describe('MonsteraComponent — cargarDatos edge cases', () => {
  let mqttSpy: jasmine.SpyObj<MqttDataService>;

  beforeEach(() => {
    mqttSpy = jasmine.createSpyObj('MqttDataService', ['getUltimoDato', 'getHistorial', 'activarRiego']);
    mqttSpy.getHistorial.and.returnValue(of({ historial: [] }));
    mqttSpy.activarRiego.and.returnValue(of({}));
  });

  async function createWithDato(dato: string | null) {
    mqttSpy.getUltimoDato.and.returnValue(of({ dato }));

    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        { provide: MqttDataService, useValue: mqttSpy },
        { provide: ActivatedRoute, useValue: buildRoute('99') }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    spyOn(window, 'fetch').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as any);
    spyOn(localStorage, 'getItem').and.returnValue('99');
    spyOn(localStorage, 'setItem');
    spyOn(window, 'alert');
    spyOn(console, 'error');
    spyOn(console, 'warn');
    spyOn(console, 'log');

    (component as any).ensureChart = jasmine.createSpy('ensureChart');
    fixture.detectChanges();
    return { component, fixture };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should not set isConnected when dato is null', async () => {
    const { component } = await createWithDato(null);
    expect(component.isConnected).toBeFalse();
    component.ngOnDestroy();
  });

  it('should set temperatura and humedadSuelo to --- when dato has no matches', async () => {
    const { component } = await createWithDato('SIN_DATOS');
    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('---');
    component.ngOnDestroy();
  });

  it('should trigger riego automatico when humidity < 30', async () => {
    const { component } = await createWithDato('T:22.0,H:20.0%');
    expect((component as any).historialRiego.length).toBeGreaterThan(0);
    expect((component as any).historialRiego[0].tipo).toBe('automático');
    component.ngOnDestroy();
  });
});

// ─── HU19 / HU21 — Actualización de lecturas ambientales (HttpTestingController)
describe('HU19 / HU21 — Actualización de lecturas ambientales', () => {
  let component: MonsteraComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MqttDataService,
        { provide: ActivatedRoute, useValue: routeNullId }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('P1 — Si /datos retorna respuesta inválida, omite el procesamiento', () => {
    const realtimeBefore = component.realtimeData;
    const connectedBefore = component.isConnected;
    const tempBefore = component.sensorData.temperatura;
    const humedadBefore = component.sensorData.humedadSuelo;

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({});

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: ['evento 1'] });

    expect(component.realtimeData).toBe(realtimeBefore);
    expect(component.isConnected).toBe(connectedBefore);
    expect(component.sensorData.temperatura).toBe(tempBefore);
    expect(component.sensorData.humedadSuelo).toBe(humedadBefore);
    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);
    expect(component.historial).toEqual(['evento 1']);
  });

  it('P2 — Si el dato es válido pero no coincide regex, actualiza UI pero no agrega puntos', () => {
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    reqDatos.flush({ dato: 'LECTURA_SIN_T_NI_H' });
    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: [] });

    expect(component.realtimeData).toBe('LECTURA_SIN_T_NI_H');
    expect(component.isConnected).toBe(true);
    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('---');
    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);
    expect(spyRiegoAutomatico).not.toHaveBeenCalled();
  });

  it('P3 — Si solo coincide temperatura, agrega punto de temperatura y no de humedad', () => {
    const spyPushPoint = spyOn<any>(component, 'pushPoint').and.callThrough();
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    reqDatos.flush({ dato: 'T: 25.5' });
    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: [] });

    expect(component.sensorData.temperatura).toBe('25.5 °C');
    expect(component.sensorData.humedadSuelo).toBe('---');
    expect((component as any).tempData.length).toBe(1);
    expect((component as any).tempData[0]).toBeCloseTo(25.5, 5);
    expect((component as any).humidityData.length).toBe(0);
    expect(spyPushPoint).toHaveBeenCalledWith('temp', 25.5);
    expect(spyRiegoAutomatico).not.toHaveBeenCalled();
  });

  it('P4 — Si solo coincide humedad >= 30, agrega punto de humedad y no ejecuta riego automático', () => {
    const spyPushPoint = spyOn<any>(component, 'pushPoint').and.callThrough();
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    reqDatos.flush({ dato: 'H: 40' });
    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: [] });

    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('40%');
    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(1);
    expect((component as any).humidityData[0]).toBeCloseTo(40, 5);
    expect(spyPushPoint).toHaveBeenCalledWith('humidity', 40);
    expect(spyRiegoAutomatico).not.toHaveBeenCalled();
    expect(component.historialRiego.length).toBe(0);
  });

  it('P5 — Si coinciden T y H >= 30, agrega ambos puntos sin riego', () => {
    const spyPushPoint = spyOn<any>(component, 'pushPoint').and.callThrough();
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    reqDatos.flush({ dato: 'T: 21.2 H: 35' });
    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: [] });

    expect(component.sensorData.temperatura).toBe('21.2 °C');
    expect(component.sensorData.humedadSuelo).toBe('35%');
    expect((component as any).tempData[0]).toBeCloseTo(21.2, 5);
    expect((component as any).humidityData[0]).toBeCloseTo(35, 5);
    expect(spyPushPoint).toHaveBeenCalledWith('temp', 21.2);
    expect(spyPushPoint).toHaveBeenCalledWith('humidity', 35);
    expect(spyRiegoAutomatico).not.toHaveBeenCalled();
    expect(component.historialRiego.length).toBe(0);
  });

  it('P6 — Si la humedad es < 30, ejecuta riego automático y registra el evento', () => {
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();
    const spyPushPoint = spyOn<any>(component, 'pushPoint').and.callThrough();

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    reqDatos.flush({ dato: 'T: 20 H: 25' });
    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: [] });

    expect(component.sensorData.temperatura).toBe('20 °C');
    expect(component.sensorData.humedadSuelo).toBe('25%');
    expect(spyPushPoint).toHaveBeenCalledWith('temp', 20);
    expect(spyPushPoint).toHaveBeenCalledWith('humidity', 25);
    expect(spyRiegoAutomatico).toHaveBeenCalled();
    expect(component.historialRiego.length).toBe(1);
    expect(component.historialRiego[0].tipo).toBe('automático');
    expect(component.historialRiego[0].mensaje).toBe('Riego automático ejecutado');
  });

  it('HU25 P1 — Si la respuesta es inválida, no actualiza el gráfico', () => {
    const pushPointSpy = spyOn<any>(component, 'pushPoint').and.callThrough();
    const riegoSpy = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    reqDatos.flush({});
    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: [] });

    expect(pushPointSpy).not.toHaveBeenCalled();
    expect(riegoSpy).not.toHaveBeenCalled();
    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);
  });

  it('HU25 P5 — Si la humedad es baja y válida, activa riego automático y actualiza el gráfico', () => {
    const pushPointSpy = spyOn<any>(component, 'pushPoint').and.callThrough();
    const riegoSpy = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    reqDatos.flush({ dato: 'H: 25' });
    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    reqHistorial.flush({ historial: [] });

    expect(pushPointSpy).toHaveBeenCalledWith('humidity', 25);
    expect(riegoSpy).toHaveBeenCalled();
    expect((component as any).humidityData.length).toBe(1);
    expect((component as any).humidityData[0]).toBeCloseTo(25, 5);
    expect(component.historialRiego.length).toBe(1);
    expect(component.historialRiego[0].tipo).toBe('automático');
    expect(component.historialRiego[0].mensaje).toBe('Riego automático ejecutado');
  });
});

// ─── HU20 — Registro automático en historial de riego (HttpTestingController)
describe('HU20 — Registro automático del evento de riego en el historial', () => {
  let component: MonsteraComponent;
  let httpMock: HttpTestingController;

  function precargarHistorial(n: number): void {
    for (let i = 0; i < n; i++) {
      component.historialRiego.push({
        tipo: 'manual',
        mensaje: `Registro antiguo #${i + 1}`,
        hora: `00:00:${String(i).padStart(2, '0')}`
      });
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MqttDataService,
        { provide: ActivatedRoute, useValue: routeNullId }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Escenario 1 — Si falla el servicio de riego, muestra error y no agrega al historial', () => {
    const alertSpy = spyOn(globalThis, 'alert');
    const consoleSpy = spyOn(console, 'error');
    const sizeBefore = component.historialRiego.length;

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    expect(req.request.method).toBe('POST');
    req.flush({ ok: false }, { status: 500, statusText: 'Server Error' });

    expect(component.historialRiego.length).toBe(sizeBefore);
    expect(alertSpy).toHaveBeenCalledWith('Error al activar el riego');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('Escenario 2 — Si el riego es exitoso y el historial < 10, agrega sin eliminar', () => {
    const alertSpy = spyOn(globalThis, 'alert');
    precargarHistorial(9);

    const ultimoAntes = component.historialRiego[component.historialRiego.length - 1];

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    req.flush({ ok: true });

    expect(component.historialRiego.length).toBe(10);
    expect(component.historialRiego[0].tipo).toBe('manual');
    expect(component.historialRiego[0].mensaje).toBe('Riego manual activado');
    const ultimoDespues = component.historialRiego[component.historialRiego.length - 1];
    expect(ultimoDespues?.mensaje).toBe(ultimoAntes?.mensaje);
    expect(alertSpy).toHaveBeenCalledWith('Riego activado correctamente');
  });

  it('Escenario 3 — Si el riego es exitoso y el historial >= 10, elimina el más antiguo', () => {
    precargarHistorial(10);
    const masAntiguoAntes = component.historialRiego[component.historialRiego.length - 1];

    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    req.flush({ ok: true });

    expect(component.historialRiego.length).toBe(10);
    expect(component.historialRiego[0].tipo).toBe('manual');

    const sigueExistiendo = component.historialRiego.some(
      (item) => item.mensaje === masAntiguoAntes.mensaje && item.hora === masAntiguoAntes.hora
    );
    expect(sigueExistiendo).toBe(false);
  });
});

// ─── HU23 — Registro de cuidados (fetchSpy directo) ─────────────────────────
describe('HU23 — Registro de cuidados (poda y fertilización)', () => {
  let component: MonsteraComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeNullId }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem('planta_usuario_id');
  });

  it('Escenario 1 — ID inválido en componente y localStorage, muestra error de ID y no hace POST', () => {
    const alertSpy = spyOn(globalThis, 'alert');
    const warnSpy = spyOn(console, 'warn');
    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = null;
    localStorage.setItem('planta_usuario_id', 'abc');

    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Riego', detalles: 'Prueba de cuidado' };
    component.guardarCuidado();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Falta id_planta_usuario');
    expect(warnSpy).toHaveBeenCalled();
    expect(component.nuevoCuidado.fecha).toBe('2026-03-04');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('Riego');
  });

  it('Escenario 2 — ID no es entero (1.5), muestra error de ID', () => {
    const alertSpy = spyOn(globalThis, 'alert');
    const warnSpy = spyOn(console, 'warn');
    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = 1.5 as any;

    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Poda', detalles: 'Prueba' };
    component.guardarCuidado();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Falta id_planta_usuario');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('Escenario 3 — Fecha vacía, muestra error de fecha y no hace POST', () => {
    const alertSpy = spyOn(globalThis, 'alert');
    const warnSpy = spyOn(console, 'warn');
    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = { fecha: '', tipo_cuidado: 'Fertilización', detalles: 'Aplicación' };
    component.guardarCuidado();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Falta fecha (YYYY-MM-DD)');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('Escenario 4 — Tipo de cuidado vacío o con espacios, muestra error de tipo', () => {
    const alertSpy = spyOn(globalThis, 'alert');
    const warnSpy = spyOn(console, 'warn');
    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: '   ', detalles: 'Detalle cualquiera' };
    component.guardarCuidado();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Falta tipo de cuidado');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('Escenario 5 — El backend responde con error, ejecuta catch y muestra alerta', async () => {
    const alertSpy = spyOn(globalThis, 'alert');
    const errorSpy = spyOn(console, 'error');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Poda', detalles: 'Detalle' };

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: false,
        text: async () => 'Error backend',
        json: async () => ({})
      } as Response)
    );

    component.guardarCuidado();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Error guardando el cuidado');
  });

  it('Escenario 6 — Flujo exitoso limpia el formulario', async () => {
    const alertSpy = spyOn(globalThis, 'alert');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = { fecha: '2026-03-04', tipo_cuidado: 'Riego', detalles: 'Aplicado' };

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => ''
      } as Response)
    );

    component.guardarCuidado();
    await flushPromises();

    expect(alertSpy).toHaveBeenCalled();
    expect(component.nuevoCuidado).toEqual({ fecha: '', tipo_cuidado: '', detalles: '' });
  });
});
