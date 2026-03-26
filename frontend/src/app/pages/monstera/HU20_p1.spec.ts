import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU20 - Registro automático del evento de riego en el historial - Escenario 1', () => {
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

  it('Escenario 1 — Si falla el servicio de riego, muestra error y no agrega registro al historial', () => {
    // Arrange
    const alertSpy = spyOn(globalThis, 'alert');
    const consoleSpy = spyOn(console, 'error');
    const sizeBefore = component.historialRiego.length;

    // Act
    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush(
      { ok: false },
      { status: 500, statusText: 'Server Error' }
    );

    // Assert
    expect(component.historialRiego.length).toBe(sizeBefore);
    expect(alertSpy).toHaveBeenCalledWith('Error al activar el riego');
    expect(consoleSpy).toHaveBeenCalled();
  });
});