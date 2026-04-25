/**
 * PRUEBAS DE REGRESIÓN - FRONTEND
 *
 * Funcionalidades Angie evaluadas:
 * HU19 - Simulación de riego manual
 * HU20 - Registro automático del evento de riego en el historial
 * HU21 - Actualización de lecturas ambientales
 * HU23 - Registro de cuidados
 * HU25 - Generación de gráfico humedad-temperatura
 *
 * Propósito:
 * Verificar que las funcionalidades principales del componente Monstera
 * se sigan creando y ejecutando correctamente después de cambios en el código.
 */

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { MonsteraComponent } from '../monstera';
import { MqttDataService } from '../../../services/mqtt-data.service';

describe('Regresión frontend - HU19, HU20, HU21, HU23 y HU25', () => {
  let mqttSpy: jasmine.SpyObj<MqttDataService>;

  beforeEach(async () => {
    mqttSpy = jasmine.createSpyObj('MqttDataService', [
      'getUltimoDato',
      'getHistorial',
      'activarRiego'
    ]);

    mqttSpy.getUltimoDato.and.returnValue(of({ dato: 'T:25.0,H:40.0%' }));
    mqttSpy.getHistorial.and.returnValue(of({ historial: ['T:25,H:40%'] }));
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

    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'getItem').and.returnValue('10');
    spyOn(window, 'alert');
    spyOn(console, 'error');
    spyOn(console, 'warn');
    spyOn(console, 'log');
  });

  it('HU19 - debe crear correctamente la pantalla de simulación de riego manual', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('HU19 - debe ejecutar el riego manual correctamente', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    component.activarRiego();

    expect(mqttSpy.activarRiego).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Riego activado correctamente');

    component.ngOnDestroy();
  });

  it('HU20 - debe registrar el evento de riego manual en el historial', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    component.activarRiego();

    expect(component.historialRiego.length).toBeGreaterThan(0);
    expect(component.historialRiego[0].tipo).toBe('manual');
    expect(component.historialRiego[0].mensaje).toBe('Riego manual activado');

    component.ngOnDestroy();
  });

  it('HU21 - debe actualizar correctamente las lecturas ambientales', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    expect(component.isConnected).toBeTrue();
    expect(component.realtimeData).toBe('T:25.0,H:40.0%');
    expect(component.sensorData.temperatura).toBe('25.0 °C');
    expect(component.sensorData.humedadSuelo).toBe('40.0%');

    component.ngOnDestroy();
  });

  it('HU23 - debe permitir registrar un cuidado con datos válidos', async () => {
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

    component.guardarCuidado();

    await Promise.resolve();
    await Promise.resolve();

    expect(globalThis.fetch).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Cuidado guardado:\nPoda el 2026-03-04');
    expect(component.nuevoCuidado).toEqual({
      fecha: '',
      tipo_cuidado: '',
      detalles: ''
    });

    component.ngOnDestroy();
  });

  it('HU25 - debe actualizar los datos necesarios para el gráfico humedad-temperatura', () => {
    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    expect((component as any).tempData.length).toBe(1);
    expect((component as any).humidityData.length).toBe(1);
    expect((component as any).tempData[0]).toBeCloseTo(25.0, 5);
    expect((component as any).humidityData[0]).toBeCloseTo(40.0, 5);

    component.ngOnDestroy();
  });
});