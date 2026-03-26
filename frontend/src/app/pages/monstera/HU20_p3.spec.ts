import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';
import { MqttDataService } from '../../services/mqtt-data.service';

describe('HU20 - Registro automático del evento de riego en el historial - Escenario 3', () => {
  let component: MonsteraComponent;
  let httpMock: HttpTestingController;

  function precargarHistorial(n: number): void {
    for (let i = 0; i < n; i++) {
      component.historialRiego.push({
        tipo: 'manual',
        mensaje: `Registro antiguo #${i + 1}`,
        hora: `00:00:${String(i).padStart(2, '0')}`
      });
    }
  }

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

  it('Escenario 3 — Si el riego se ejecuta correctamente y el historial supera el límite, elimina el registro más antiguo y mantiene máximo 10', () => {
    // Arrange
    precargarHistorial(10);
    const masAntiguoAntes = component.historialRiego[component.historialRiego.length - 1];

    // Act
    component.activarRiego();

    const req = httpMock.expectOne('http://localhost:3000/api/regar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush({ ok: true });

    // Assert
    expect(component.historialRiego.length).toBe(10);
    expect(component.historialRiego[0].tipo).toBe('manual');
    expect(component.historialRiego[0].mensaje).toBe('Riego manual activado');

    const sigueExistiendo = component.historialRiego.some(
      (item) =>
        item.mensaje === masAntiguoAntes.mensaje &&
        item.hora === masAntiguoAntes.hora
    );

    expect(sigueExistiendo).toBe(false);
  });
});