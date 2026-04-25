/**
 * PRUEBAS DE SEGURIDAD - FRONTEND
 *
 * Funcionalidades Angie evaluadas:
 * HU19 - Simulación de riego manual
 * HU20 - Registro automático del evento de riego en el historial
 * HU21 - Actualización de lecturas ambientales
 * HU23 - Registro de cuidados
 * HU25 - Generación de gráfico humedad-temperatura
 *
 * Objetivo:
 * Validar que el componente controle entradas inválidas,
 * errores de servicios, ausencia de identificadores y respuestas incorrectas
 * sin romper la interfaz ni ejecutar operaciones indebidas.
 */

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MonsteraComponent } from '../monstera';
import { MqttDataService } from '../../../services/mqtt-data.service';

describe('Seguridad frontend - HU19, HU20, HU21, HU23 y HU25', () => {
  let mqttSpy: jasmine.SpyObj<MqttDataService>;

  async function crearComponente(
    queryParam: string | null = '10',
    localStorageValue: string | null = '10',
    dato: string | null = 'T:25.0,H:40.0%'
  ) {
    mqttSpy = jasmine.createSpyObj('MqttDataService', [
      'getUltimoDato',
      'getHistorial',
      'activarRiego'
    ]);

    mqttSpy.getUltimoDato.and.returnValue(of({ dato }));
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
                get: () => queryParam
              }
            }
          }
        }
      ]
    }).compileComponents();

    spyOn(localStorage, 'getItem').and.returnValue(localStorageValue);
    spyOn(localStorage, 'setItem');
    spyOn(window, 'alert');
    spyOn(console, 'error');
    spyOn(console, 'warn');
    spyOn(console, 'log');

    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).ensureChart = jasmine.createSpy('ensureChart');

    fixture.detectChanges();

    return { fixture, component };
  }

  async function esperarPromesas(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('HU19 - si falla el servicio de riego, muestra error y no agrega historial', async () => {
    const { component } = await crearComponente();

    mqttSpy.activarRiego.and.returnValue(
      throwError(() => new Error('Error de riego'))
    );

    const totalAntes = component.historialRiego.length;

    component.activarRiego();

    expect(window.alert).toHaveBeenCalledWith('Error al activar el riego');
    expect(console.error).toHaveBeenCalled();
    expect(component.historialRiego.length).toBe(totalAntes);

    component.ngOnDestroy();
  });

  it('HU20 - no registra evento de riego en historial cuando el riego falla', async () => {
    const { component } = await crearComponente();

    mqttSpy.activarRiego.and.returnValue(
      throwError(() => new Error('Backend no disponible'))
    );

    component.activarRiego();

    expect(component.historialRiego.length).toBe(0);
    expect(window.alert).toHaveBeenCalledWith('Error al activar el riego');

    component.ngOnDestroy();
  });

  it('HU21 - si la lectura ambiental es inválida, no actualiza temperatura ni humedad', async () => {
    const { component } = await crearComponente('10', '10', 'LECTURA_INVALIDA');

    expect(component.isConnected).toBeTrue();
    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('---');
    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);

    component.ngOnDestroy();
  });

  it('HU21 - si no llega dato ambiental, no marca conexión activa', async () => {
    const { component } = await crearComponente('10', '10', null);

    expect(component.isConnected).toBeFalse();
    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('---');

    component.ngOnDestroy();
  });

  it('HU23 - rechaza guardar cuidado sin id_planta_usuario válido', async () => {
    const { component } = await crearComponente('abc', null);

    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = null;

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: 'Poda',
      detalles: 'Retiro de hojas secas'
    };

    component.guardarCuidado();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Falta id_planta_usuario');
    expect(console.warn).toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it('HU23 - rechaza guardar cuidado sin fecha', async () => {
    const { component } = await crearComponente();

    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '',
      tipo_cuidado: 'Poda',
      detalles: 'Detalle'
    };

    component.guardarCuidado();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Falta fecha (YYYY-MM-DD)');
    expect(console.warn).toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it('HU23 - rechaza guardar cuidado sin tipo de cuidado', async () => {
    const { component } = await crearComponente();

    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: '   ',
      detalles: 'Detalle'
    };

    component.guardarCuidado();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Falta tipo de cuidado');
    expect(console.warn).toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it('HU23 - si el backend falla al guardar cuidado, muestra error controlado', async () => {
    const { component } = await crearComponente();

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.reject(new Error('Error backend'))
    );

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: 'Poda',
      detalles: 'Detalle'
    };

    component.guardarCuidado();

    await esperarPromesas();

    expect(window.alert).toHaveBeenCalledWith('Error guardando el cuidado');
    expect(console.error).toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it('HU25 - si no hay ID de planta, no verifica condiciones', async () => {
    const { component } = await crearComponente('abc', null);

    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = null;

    component.verificarCondiciones();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Falta ID de planta');

    component.ngOnDestroy();
  });

  it('HU25 - si falla la verificación de condiciones, muestra error controlado', async () => {
    const { component } = await crearComponente();

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.reject(new Error('Error de red'))
    );

    component.verificarCondiciones();

    await esperarPromesas();

    expect(window.alert).toHaveBeenCalledWith('Error al verificar las condiciones');
    expect(console.error).toHaveBeenCalled();

    component.ngOnDestroy();
  });
});