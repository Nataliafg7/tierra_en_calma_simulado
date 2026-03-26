import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU25 - Generación del gráfico de humedad - Escenario P2', () => {
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
  });

  it('P2 — Si solo hay temperatura, agrega punto de temperatura y no de humedad', () => {
    // Arrange
    const pushPointSpy = spyOn<any>(component, 'pushPoint').and.callThrough();
    const riegoSpy = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'T: 24.8' });

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHistorial.request.method).toBe('GET');
    reqHistorial.flush({ historial: [] });

    // Assert
    expect(pushPointSpy).toHaveBeenCalledWith('temp', 24.8);
    expect(pushPointSpy).not.toHaveBeenCalledWith('humidity', jasmine.any(Number));
    expect(riegoSpy).not.toHaveBeenCalled();

    expect((component as any).tempData.length).toBe(1);
    expect((component as any).tempData[0]).toBeCloseTo(24.8, 5);
    expect((component as any).humidityData.length).toBe(0);
  });
});