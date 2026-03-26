import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU19 - Actualización de lecturas ambientales - Escenario P2', () => {
  let component: MonsteraComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MqttDataService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null // dummy
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

  it('P2 — Si el dato es válido pero no coincide con ninguna regex, actualiza UI pero no agrega puntos', () => {
    // Arrange
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'LECTURA_SIN_T_NI_H' });

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHistorial.request.method).toBe('GET');
    reqHistorial.flush({ historial: [] });

    // Assert
    expect(component.realtimeData).toBe('LECTURA_SIN_T_NI_H');
    expect(component.isConnected).toBe(true);
    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('---');

    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);

    expect(spyRiegoAutomatico).not.toHaveBeenCalled();
  });
});