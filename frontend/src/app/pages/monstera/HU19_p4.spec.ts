import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU19 - Actualización de lecturas ambientales - Escenario P4', () => {
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

  it('P4 — Si solo coincide humedad y es mayor o igual a 30, agrega punto de humedad y no ejecuta riego automático', () => {
    // Arrange
    const spyPushPoint = spyOn<any>(component, 'pushPoint').and.callThrough();
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'H: 40' });

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHistorial.request.method).toBe('GET');
    reqHistorial.flush({ historial: [] });

    // Assert
    expect(component.sensorData.temperatura).toBe('---');
    expect(component.sensorData.humedadSuelo).toBe('40%');

    expect((component as any).tempData.length).toBe(0);
    expect((component as any).humidityData.length).toBe(1);
    expect((component as any).humidityData[0]).toBeCloseTo(40, 5);

    expect(spyPushPoint).toHaveBeenCalledWith('humidity', 40);
    expect(spyRiegoAutomatico).not.toHaveBeenCalled();
    expect(component.historialRiego.length).toBe(0);
  });
});