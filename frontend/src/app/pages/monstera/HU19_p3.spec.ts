import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU19 - Actualización de lecturas ambientales - Escenario P3', () => {
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

  it('P3 — Si solo coincide temperatura, agrega punto de temperatura y no de humedad', () => {
    // Arrange
    const spyPushPoint = spyOn<any>(component, 'pushPoint').and.callThrough();
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'T: 25.5' });

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHistorial.request.method).toBe('GET');
    reqHistorial.flush({ historial: [] });

    // Assert
    expect(component.sensorData.temperatura).toBe('25.5 °C');
    expect(component.sensorData.humedadSuelo).toBe('---');

    expect((component as any).tempData.length).toBe(1);
    expect((component as any).tempData[0]).toBeCloseTo(25.5, 5);
    expect((component as any).humidityData.length).toBe(0);

    expect(spyPushPoint).toHaveBeenCalledWith('temp', 25.5);
    expect(spyRiegoAutomatico).not.toHaveBeenCalled();
  });
});