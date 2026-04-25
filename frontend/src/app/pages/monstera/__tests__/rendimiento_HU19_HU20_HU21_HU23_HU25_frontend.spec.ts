/**
 * PRUEBAS DE RENDIMIENTO - FRONTEND
 *
 * Funcionalidades Angie evaluadas:
 * HU19 - Simulación de riego manual
 * HU20 - Registro automático del evento de riego en el historial
 * HU21 - Actualización de lecturas ambientales
 * HU23 - Registro de cuidados
 * HU25 - Generación de gráfico humedad-temperatura
 *
 * Objetivo:
 * Verificar que el componente Monstera y sus funcionalidades principales
 * se creen, carguen y ejecuten en un tiempo adecuado dentro del navegador
 * de pruebas.
 */

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { MonsteraComponent } from '../monstera';
import { MqttDataService } from '../../../services/mqtt-data.service';

describe('Rendimiento frontend - HU19, HU20, HU21, HU23 y HU25', () => {
  let mqttSpy: jasmine.SpyObj<MqttDataService>;

  beforeEach(async () => {
    mqttSpy = jasmine.createSpyObj('MqttDataService', [
      'getUltimoDato',
      'getHistorial',
      'activarRiego'
    ]);

    mqttSpy.getUltimoDato.and.returnValue(of({ dato: 'T:25.0,H:40.0%' }));
    mqttSpy.getHistorial.and.returnValue(of({ historial: [] }));
    mqttSpy.activarRiego.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        { provide: MqttDataService, useValue: mqttSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => '10'
              }
            }
          }
        }
      ]
    }).compileComponents();

    spyOn(localStorage, 'getItem').and.returnValue('10');
    spyOn(localStorage, 'setItem');
    spyOn(window, 'alert');
    spyOn(console, 'error');
    spyOn(console, 'warn');
    spyOn(console, 'log');
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('HU19 - carga la pantalla de riego manual en tiempo adecuado', () => {
    const inicio = performance.now();

    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    const tiempo = performance.now() - inicio;

    expect(component).toBeTruthy();
    expect(tiempo).toBeLessThan(1000);

    component.ngOnDestroy();
  });

  it('HU19 - ejecuta el riego manual en tiempo adecuado', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    const inicio = performance.now();

    component.activarRiego();

    const tiempo = performance.now() - inicio;

    expect(mqttSpy.activarRiego).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Riego activado correctamente');
    expect(tiempo).toBeLessThan(500);

    component.ngOnDestroy();
  });

  it('HU20 - registra el evento de riego en historial en tiempo adecuado', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    const inicio = performance.now();

    component.activarRiego();

    const tiempo = performance.now() - inicio;

    expect(component.historialRiego.length).toBeGreaterThan(0);
    expect(component.historialRiego[0].mensaje).toBe('Riego manual activado');
    expect(tiempo).toBeLessThan(500);

    component.ngOnDestroy();
  });

  it('HU21 - actualiza lecturas ambientales en tiempo adecuado', () => {
    const inicio = performance.now();

    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    const tiempo = performance.now() - inicio;

    expect(component.isConnected).toBeTrue();
    expect(component.sensorData.temperatura).toBe('25.0 °C');
    expect(component.sensorData.humedadSuelo).toBe('40.0%');
    expect(tiempo).toBeLessThan(1000);

    component.ngOnDestroy();
  });

  it('HU23 - registra cuidado en tiempo adecuado', async () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => ''
      } as Response)
    );

    fixture.detectChanges();

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: 'Poda',
      detalles: 'Retiro de hojas secas'
    };

    const inicio = performance.now();

    component.guardarCuidado();

    await Promise.resolve();
    await Promise.resolve();

    const tiempo = performance.now() - inicio;

    expect(globalThis.fetch).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Cuidado guardado:\nPoda el 2026-03-04');
    expect(tiempo).toBeLessThan(1000);

    component.ngOnDestroy();
  });

  it('HU25 - carga datos del gráfico humedad-temperatura en tiempo adecuado', () => {
    const inicio = performance.now();

    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    const tiempo = performance.now() - inicio;

    expect((component as any).tempData.length).toBe(1);
    expect((component as any).humidityData.length).toBe(1);
    expect((component as any).tempData[0]).toBeCloseTo(25.0, 5);
    expect((component as any).humidityData[0]).toBeCloseTo(40.0, 5);
    expect(tiempo).toBeLessThan(1000);

    component.ngOnDestroy();
  });

  it('Carga - múltiples ejecuciones de riego manual sin degradación', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    const inicio = performance.now();

    for (let i = 0; i < 10; i++) {
      component.activarRiego();
    }

    const tiempo = performance.now() - inicio;

    expect(mqttSpy.activarRiego).toHaveBeenCalledTimes(10);
    expect(component.historialRiego.length).toBeLessThanOrEqual(10);
    expect(tiempo).toBeLessThan(1000);

    component.ngOnDestroy();
  });
});