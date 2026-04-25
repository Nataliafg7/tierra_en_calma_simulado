import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('MonsteraComponent', () => {
  let component: MonsteraComponent;
  let httpMock: HttpTestingController;
  let originalFetch: any;

  beforeEach(async () => {
    originalFetch = (globalThis as any).fetch;
    localStorage.clear();

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
    localStorage.clear();
    (globalThis as any).fetch = originalFetch;
  });

  // Helper: precargar historial con N registros
  function precargarHistorial(n: number): void {
    for (let i = 0; i < n; i++) {
      component.historialRiego.push({
        tipo: 'manual',
        mensaje: `Registro antiguo #${i + 1}`,
        hora: `00:00:${String(i).padStart(2, '0')}`,
      });
    }
  }

  // Helper: ejecutar cargarDatos (private) + responder /historial
  function ejecutarCargarDatosYResponderHistorial(hist: string[] = []): void {
    (component as any).cargarDatos();

    const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');

    expect(reqHist.request.method)
      .withContext('Debe consultar el historial mediante GET')
      .toEqual('GET');

    reqHist.flush({ historial: hist });
  }

  // Helper: esperar a que se resuelvan promesas del .then/.catch de fetch
  function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  describe('activarRiego()', () => {
    // Escenario P2 — Respuesta exitosa
    it('P2 — Debe activar riego y registrar evento en historial', () => {
      component.activarRiego();

      const req = httpMock.expectOne('http://localhost:3000/api/regar');

      expect(req.request.method)
        .withContext('Debe enviar la solicitud de riego mediante POST')
        .toEqual('POST');

      req.flush({ ok: true });

      expect(component.historialRiego)
        .withContext('El historial debe tener un registro después del riego exitoso')
        .toHaveSize(1);

      expect(component.historialRiego[0])
        .withContext('El registro debe corresponder a un riego manual activado')
        .toEqual(jasmine.objectContaining({
          tipo: 'manual',
          mensaje: 'Riego manual activado'
        }));
    });

    // Escenario P1 — Error en backend
    it('P1 — Debe manejar error si falla la activación del riego', () => {
      component.activarRiego();

      const req = httpMock.expectOne('http://localhost:3000/api/regar');

      expect(req.request.method)
        .withContext('Debe enviar la solicitud de riego mediante POST')
        .toEqual('POST');

      req.flush(
        { ok: false },
        { status: 500, statusText: 'Server Error' }
      );

      expect(component.historialRiego)
        .withContext('El historial no debe registrar eventos cuando el backend falla')
        .toHaveSize(0);
    });
  });

  // HDEU: Registro automático del evento de riego en el historial
  describe('HDEU - Registro automático del evento de riego en el historial', () => {
    // Escenario 1 — Error en el servicio de riego
    // Condición: el servicio falla
    // Resultado esperado: NO agrega registro al historial
    it('HDEU Escenario 1 — Si falla el servicio, NO agrega registro al historial', () => {
      precargarHistorial(2);
      const sizeBefore = component.historialRiego.length;

      component.activarRiego();

      const req = httpMock.expectOne('http://localhost:3000/api/regar');

      expect(req.request.method)
        .withContext('Debe enviar la solicitud de riego mediante POST')
        .toEqual('POST');

      expect(req.request.body)
        .withContext('El cuerpo enviado al endpoint de riego debe ser vacío')
        .toEqual({});

      req.flush(
        { ok: false },
        { status: 500, statusText: 'Server Error' }
      );

      expect(component.historialRiego)
        .withContext('El historial no debe cambiar cuando el servicio de riego falla')
        .toHaveSize(sizeBefore);
    });

    // Escenario 2 — Éxito y el historial NO supera 10 registros
    // Condición: éxito y tamaño previo <= 9 (para quedar en 10)
    // Resultado esperado: agrega, NO elimina, queda <= 10
    it('HDEU Escenario 2 — En éxito agrega registro y NO elimina si queda en <= 10', () => {
      precargarHistorial(9);
      const lastBefore = component.historialRiego[component.historialRiego.length - 1];

      component.activarRiego();

      const req = httpMock.expectOne('http://localhost:3000/api/regar');

      expect(req.request.method)
        .withContext('Debe enviar la solicitud de riego mediante POST')
        .toEqual('POST');

      req.flush({ ok: true });

      expect(component.historialRiego)
        .withContext('El historial debe quedar con 10 registros como máximo')
        .toHaveSize(10);

      expect(component.historialRiego[0])
        .withContext('El nuevo registro debe agregarse al inicio del historial')
        .toEqual(jasmine.objectContaining({
          tipo: 'manual',
          mensaje: 'Riego manual activado'
        }));

      const lastAfter = component.historialRiego[component.historialRiego.length - 1];

      expect(lastAfter)
        .withContext('No debe eliminar el último registro anterior cuando el historial queda en 10')
        .toEqual(jasmine.objectContaining({
          mensaje: lastBefore.mensaje,
          hora: lastBefore.hora
        }));
    });

    // Escenario 3 — Éxito y el historial supera 10 registros
    // Condición: éxito y tamaño previo = 10
    // Resultado esperado: agrega, hace pop, queda en 10
    it('HDEU Escenario 3 — En éxito elimina el registro más antiguo si supera 10', () => {
      precargarHistorial(10);
      const oldestBefore = component.historialRiego[component.historialRiego.length - 1];

      component.activarRiego();

      const req = httpMock.expectOne('http://localhost:3000/api/regar');

      expect(req.request.method)
        .withContext('Debe enviar la solicitud de riego mediante POST')
        .toEqual('POST');

      req.flush({ ok: true });

      expect(component.historialRiego)
        .withContext('El historial debe conservar máximo 10 registros')
        .toHaveSize(10);

      expect(component.historialRiego[0])
        .withContext('El nuevo riego manual debe quedar registrado al inicio')
        .toEqual(jasmine.objectContaining({
          mensaje: 'Riego manual activado'
        }));

      const stillExists = component.historialRiego.some(
        (x) => x.mensaje === oldestBefore.mensaje && x.hora === oldestBefore.hora
      );

      expect(stillExists)
        .withContext('El registro más antiguo debe eliminarse cuando se supera el límite de 10')
        .toBeFalse();
    });
  });

  // NUEVAS PRUEBAS — Actualización de lecturas ambientales (cargarDatos)
  describe('cargarDatos()', () => {
    // Escenario 1 (P1) — Respuesta inválida, se omite procesamiento
    // Condición: res no existe o res.dato inválido
    // Resultado: no actualiza UI ni puntos; espera siguiente intervalo
    it('Lecturas P1 — Si /datos retorna res inválido, NO actualiza UI ni puntos', () => {
      // Arrange
      const uiBefore = component.realtimeData;
      const connectedBefore = component.isConnected;
      const tempBefore = component.sensorData.temperatura;
      const sueloBefore = component.sensorData.humedadSuelo;

      // Act
      (component as any).cargarDatos();

      const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');

      expect(reqDatos.request.method)
        .withContext('Debe consultar los datos ambientales mediante GET')
        .toEqual('GET');

      reqDatos.flush({});

      const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');

      expect(reqHist.request.method)
        .withContext('Debe consultar el historial aunque /datos sea inválido')
        .toEqual('GET');

      reqHist.flush({ historial: ['x'] });

      // Assert: UI no cambia
      expect(component.realtimeData)
        .withContext('No debe cambiar realtimeData si la respuesta no trae dato válido')
        .toBe(uiBefore);

      expect(component.isConnected)
        .withContext('No debe cambiar el estado de conexión si la respuesta no trae dato válido')
        .toBe(connectedBefore);

      expect(component.sensorData.temperatura)
        .withContext('No debe cambiar la temperatura si la respuesta no trae dato válido')
        .toBe(tempBefore);

      expect(component.sensorData.humedadSuelo)
        .withContext('No debe cambiar la humedad si la respuesta no trae dato válido')
        .toBe(sueloBefore);

      // Assert: no puntos
      expect((component as any).tempData)
        .withContext('No debe agregar puntos de temperatura cuando el dato es inválido')
        .toHaveSize(0);

      expect((component as any).humidityData)
        .withContext('No debe agregar puntos de humedad cuando el dato es inválido')
        .toHaveSize(0);

      // Assert: historial sí se actualiza por el segundo GET
      expect(component.historial)
        .withContext('El historial debe actualizarse con la respuesta de /historial')
        .toEqual(['x']);
    });

    // Escenario 2 (P2) — Respuesta válida, pero NO tempMatch y NO sueloMatch
    // Condición: dato sin patrones T ni H
    // Resultado: actualiza UI base, pero NO agrega puntos
    it('Lecturas P2 — Dato válido sin regex: actualiza UI, NO agrega puntos', () => {
      (component as any).cargarDatos();

      const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');

      expect(reqDatos.request.method)
        .withContext('Debe consultar los datos ambientales mediante GET')
        .toEqual('GET');

      reqDatos.flush({ dato: 'LECTURA_SIN_T_NI_H' });

      const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
      reqHist.flush({ historial: [] });

      expect(component.realtimeData)
        .withContext('Debe actualizar realtimeData con el texto recibido')
        .toBe('LECTURA_SIN_T_NI_H');

      expect(component.isConnected)
        .withContext('Debe marcar conexión activa cuando llega un dato válido')
        .toBeTrue();

      expect(component.sensorData)
        .withContext('No debe cambiar temperatura ni humedad si el dato no cumple regex')
        .toEqual(jasmine.objectContaining({
          temperatura: '---',
          humedadSuelo: '---'
        }));

      expect((component as any).tempData)
        .withContext('No debe agregar puntos de temperatura sin coincidencia T')
        .toHaveSize(0);

      expect((component as any).humidityData)
        .withContext('No debe agregar puntos de humedad sin coincidencia H')
        .toHaveSize(0);
    });

    // Escenario 3 (P3) — tempMatch SÍ, sueloMatch NO
    // Resultado: agrega punto de temperatura, no de humedad
    it('Lecturas P3 — Solo T: agrega punto temp, NO agrega humedad', () => {
      (component as any).cargarDatos();

      const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');

      expect(reqDatos.request.method)
        .withContext('Debe consultar los datos ambientales mediante GET')
        .toEqual('GET');

      reqDatos.flush({ dato: 'T: 25.5' });

      const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
      reqHist.flush({ historial: [] });

      expect(component.sensorData)
        .withContext('Debe actualizar solo la temperatura cuando solo llega T')
        .toEqual(jasmine.objectContaining({
          temperatura: '25.5 °C',
          humedadSuelo: '---'
        }));

      expect((component as any).tempData)
        .withContext('Debe agregar un punto de temperatura')
        .toHaveSize(1);

      expect((component as any).tempData[0])
        .withContext('El punto de temperatura debe coincidir con el dato recibido')
        .toBeCloseTo(25.5, 5);

      expect((component as any).humidityData)
        .withContext('No debe agregar puntos de humedad cuando no llega H')
        .toHaveSize(0);
    });

    // Escenario 4 (P4) — tempMatch NO, sueloMatch SÍ y NO dispara riego
    // Condición: H existe y h >= 30
    // Resultado: agrega humedad, NO riego automático
    it('Lecturas P4 — Solo H (>=30): agrega humedad, NO ejecuta riego automático', () => {
      (component as any).cargarDatos();

      const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');

      expect(reqDatos.request.method)
        .withContext('Debe consultar los datos ambientales mediante GET')
        .toEqual('GET');

      reqDatos.flush({ dato: 'H: 40' });

      const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
      reqHist.flush({ historial: [] });

      expect(component.sensorData)
        .withContext('Debe actualizar solo humedad cuando solo llega H')
        .toEqual(jasmine.objectContaining({
          temperatura: '---',
          humedadSuelo: '40%'
        }));

      expect((component as any).humidityData)
        .withContext('Debe agregar un punto de humedad')
        .toHaveSize(1);

      expect((component as any).humidityData[0])
        .withContext('El punto de humedad debe coincidir con el dato recibido')
        .toBeCloseTo(40, 5);

      expect(component.historialRiego)
        .withContext('No debe registrar riego automático cuando la humedad es >= 30')
        .toHaveSize(0);
    });

    // Escenario 5 (P5) — tempMatch SÍ, sueloMatch SÍ y NO dispara riego
    // Condición: h >= 30
    // Resultado: agrega ambos puntos, NO riego automático
    it('Lecturas P5 — T y H (>=30): agrega temp y humedad, NO ejecuta riego automático', () => {
      (component as any).cargarDatos();

      const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');

      expect(reqDatos.request.method)
        .withContext('Debe consultar los datos ambientales mediante GET')
        .toEqual('GET');

      reqDatos.flush({ dato: 'T: 21.2 H: 35' });

      const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
      reqHist.flush({ historial: [] });

      expect(component.sensorData)
        .withContext('Debe actualizar temperatura y humedad cuando llegan T y H')
        .toEqual(jasmine.objectContaining({
          temperatura: '21.2 °C',
          humedadSuelo: '35%'
        }));

      expect((component as any).tempData)
        .withContext('Debe agregar un punto de temperatura')
        .toHaveSize(1);

      expect((component as any).humidityData)
        .withContext('Debe agregar un punto de humedad')
        .toHaveSize(1);

      expect(component.historialRiego)
        .withContext('No debe registrar riego automático cuando la humedad es >= 30')
        .toHaveSize(0);
    });

    // ---------------------------------------------------------
    // Escenario 6 (P6) — sueloMatch SÍ y h < 30 dispara riego automático
    // Resultado: ejecuta riego automático y registra en historialRiego
    // ---------------------------------------------------------
    it('Lecturas P6 — H (<30): ejecuta riego automático y registra evento automático', () => {
      (component as any).cargarDatos();

      const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');

      expect(reqDatos.request.method)
        .withContext('Debe consultar los datos ambientales mediante GET')
        .toEqual('GET');

      reqDatos.flush({ dato: 'T: 20 H: 25' });

      const reqHist = httpMock.expectOne('http://localhost:3000/api/historial');
      reqHist.flush({ historial: [] });

      expect((component as any).tempData)
        .withContext('Debe agregar un punto de temperatura')
        .toHaveSize(1);

      expect((component as any).humidityData)
        .withContext('Debe agregar un punto de humedad')
        .toHaveSize(1);

      expect(component.historialRiego)
        .withContext('Debe registrar un evento de riego automático cuando H < 30')
        .toHaveSize(1);

      expect(component.historialRiego[0])
        .withContext('El evento registrado debe ser automático')
        .toEqual(jasmine.objectContaining({
          tipo: 'automático',
          mensaje: 'Riego automático ejecutado'
        }));
    });
  });

  // =====================================================================
  // NUEVAS PRUEBAS — Registro de cuidados (guardarCuidado)
  // =====================================================================
  describe('guardarCuidado()', () => {
    it('Cuidados Escenario 1 — ID inválido y localStorage inválido: NO hace POST y NO limpia formulario', () => {
      (component as any).idPlantaUsuario = null;
      localStorage.setItem('planta_usuario_id', 'abc');

      component.nuevoCuidado = {
        fecha: '2026-03-04',
        tipo_cuidado: 'Riego',
        detalles: 'x'
      };

      (globalThis as any).fetch = () => {
        throw new Error('No debería llamar fetch en este escenario');
      };

      component.guardarCuidado();

      expect(component.nuevoCuidado)
        .withContext('El formulario no debe limpiarse cuando el ID es inválido')
        .toEqual(jasmine.objectContaining({
          fecha: '2026-03-04',
          tipo_cuidado: 'Riego',
          detalles: 'x'
        }));
    });

    it('Cuidados Escenario 2 — ID no entero: NO hace POST y NO limpia formulario', () => {
      (component as any).idPlantaUsuario = 1.5 as any;

      component.nuevoCuidado = {
        fecha: '2026-03-04',
        tipo_cuidado: 'Poda',
        detalles: 'x'
      };

      (globalThis as any).fetch = () => {
        throw new Error('No debería llamar fetch en este escenario');
      };

      component.guardarCuidado();

      expect(component.nuevoCuidado)
        .withContext('El formulario debe conservarse cuando el ID no es entero')
        .toEqual(jasmine.objectContaining({
          fecha: '2026-03-04',
          tipo_cuidado: 'Poda'
        }));
    });

    it('Cuidados Escenario 3 — Fecha inválida: NO hace POST y NO limpia formulario', () => {
      (component as any).idPlantaUsuario = 10;

      component.nuevoCuidado = {
        fecha: '',
        tipo_cuidado: 'Fertilización',
        detalles: 'x'
      };

      (globalThis as any).fetch = () => {
        throw new Error('No debería llamar fetch en este escenario');
      };

      component.guardarCuidado();

      expect(component.nuevoCuidado)
        .withContext('El formulario debe conservarse cuando la fecha es inválida')
        .toEqual(jasmine.objectContaining({
          fecha: '',
          tipo_cuidado: 'Fertilización'
        }));
    });

    it('Cuidados Escenario 4 — Tipo vacío/espacios: NO hace POST y NO limpia formulario', () => {
      (component as any).idPlantaUsuario = 10;

      component.nuevoCuidado = {
        fecha: '2026-03-04',
        tipo_cuidado: '   ',
        detalles: 'x'
      };

      (globalThis as any).fetch = () => {
        throw new Error('No debería llamar fetch en este escenario');
      };

      component.guardarCuidado();

      expect(component.nuevoCuidado)
        .withContext('El formulario debe conservarse cuando el tipo de cuidado es inválido')
        .toEqual(jasmine.objectContaining({
          fecha: '2026-03-04',
          tipo_cuidado: '   '
        }));
    });

    it('Cuidados Escenario 5 — POST falla: NO limpia formulario', async () => {
      (component as any).idPlantaUsuario = 10;

      component.nuevoCuidado = {
        fecha: '2026-03-04',
        tipo_cuidado: 'Poda',
        detalles: 'detalle'
      };

      (globalThis as any).fetch = () =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Error backend'),
          json: () => Promise.resolve({}),
        });

      component.guardarCuidado();
      await flushPromises();

      expect(component.nuevoCuidado)
        .withContext('El formulario no debe limpiarse cuando el POST falla')
        .toEqual(jasmine.objectContaining({
          fecha: '2026-03-04',
          tipo_cuidado: 'Poda',
          detalles: 'detalle'
        }));
    });

    it('Cuidados Escenario 6 — POST exitoso: limpia formulario', async () => {
      (component as any).idPlantaUsuario = 10;

      component.nuevoCuidado = {
        fecha: '2026-03-04',
        tipo_cuidado: 'Riego',
        detalles: 'algo'
      };

      (globalThis as any).fetch = () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true }),
          text: () => Promise.resolve(''),
        });

      component.guardarCuidado();
      await flushPromises();

      expect(component.nuevoCuidado)
        .withContext('El formulario debe limpiarse después de guardar exitosamente')
        .toEqual({
          fecha: '',
          tipo_cuidado: '',
          detalles: ''
        });
    });
  });
});
