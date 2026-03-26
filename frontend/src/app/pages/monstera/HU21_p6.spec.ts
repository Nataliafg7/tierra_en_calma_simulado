import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU21 - Actualización de lecturas ambientales - Escenario P6', () => {
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

  it('P6 — Si la humedad es menor a 30, ejecuta riego automático y registra el evento', () => {
    // Arrange
    const spyRiegoAutomatico = spyOn<any>(component, 'activarRiegoAutomatico').and.callThrough();
    const spyPushPoint = spyOn<any>(component, 'pushPoint').and.callThrough();

    // Act
    (component as any).cargarDatos();

    const reqDatos = httpMock.expectOne('http://localhost:3000/api/datos');
    expect(reqDatos.request.method).toBe('GET');
    reqDatos.flush({ dato: 'T: 20 H: 25' });

    const reqHistorial = httpMock.expectOne('http://localhost:3000/api/historial');
    expect(reqHistorial.request.method).toBe('GET');
    reqHistorial.flush({ historial: [] });

    // Assert
    expect(component.sensorData.temperatura).toBe('20 °C');
    expect(component.sensorData.humedadSuelo).toBe('25%');

    expect((component as any).tempData.length).toBe(1);
    expect((component as any).humidityData.length).toBe(1);

    expect(spyPushPoint).toHaveBeenCalledWith('temp', 20);
    expect(spyPushPoint).toHaveBeenCalledWith('humidity', 25);
    expect(spyRiegoAutomatico).toHaveBeenCalled();

    expect(component.historialRiego.length).toBe(1);
    expect(component.historialRiego[0].tipo).toBe('automático');
    expect(component.historialRiego[0].mensaje).toBe('Riego automático ejecutado');
  });
});