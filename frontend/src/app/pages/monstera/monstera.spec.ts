import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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

// ─── Suite principal (id válido desde queryParam) ────────────────────────────
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

  // ─── activarRiego ──────────────────────────────────────────────────────────

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
    // buildRouteNoId() returns 'abc' so Number('abc')=NaN, not integer → fallback to localStorage
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

// ─── Suite separada: cargarDatos edge cases ──────────────────────────────────
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
