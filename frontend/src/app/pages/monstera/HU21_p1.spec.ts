import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU21 - Actualización de lecturas ambientales - Escenario P1', () => {
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

  it('P1 — Si /datos retorna respuesta inválida, se omite el procesamiento', () => {
    // Arrange
    const realtimeBefore = component.realtimeData;
    const connectedBefore = component.isConnected;
    const tempBefore = component.sensorData.temperatura;
    const humedadBefore = component.sensorData.humedadSuelo;

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({}); // stub: respuesta inválida

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHistorial.request.method).toBe('GET');
    reqHistorial.flush({ historial: ['evento 1'] });

    // Assert
    expect(component.realtimeData).toBe(realtimeBefore);
    expect(component.isConnected).toBe(connectedBefore);
    expect(component.sensorData.temperatura).toBe(tempBefore);
    expect(component.sensorData.humedadSuelo).toBe(humedadBefore);

    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(0);

    expect(component.historial).toEqual(['evento 1']);
  });
});