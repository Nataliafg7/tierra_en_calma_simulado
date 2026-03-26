import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU25 - Generación del gráfico de humedad - Escenario P5', () => {
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

  it('P5 — Si la humedad es baja y válida, activa riego automático y actualiza el gráfico', () => {
    // Arrange
    const pushPointSpy = spyOn<any>(component, 'pushPoint').and.callThrough();
    const riegoSpy = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'H: 25' });

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHistorial.request.method).toBe('GET');
    reqHistorial.flush({ historial: [] });

    // Assert
    expect(pushPointSpy).toHaveBeenCalledWith('humidity', 25);
    expect(riegoSpy).toHaveBeenCalled();

    expect((component as any).humidityData.length).toBe(1);
    expect((component as any).humidityData[0]).toBeCloseTo(25, 5);

    expect(component.historialRiego.length).toBe(1);
    expect(component.historialRiego[0].tipo).toBe('automático');
    expect(component.historialRiego[0].mensaje).toBe('Riego automático ejecutado');
  });
});