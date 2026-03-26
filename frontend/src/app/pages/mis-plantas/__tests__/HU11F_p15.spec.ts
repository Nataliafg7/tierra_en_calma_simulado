/**
 * HU11F - Visualización de plantas registradas
 * Escenario P15: Retroceso del carrusel
 *
 * Objetivo de la prueba:
 * Verificar que el carrusel retroceda correctamente
 * cuando el índice actual es mayor que cero.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa un carrusel simulado.
 * - Self-validating: valida el resultado con expect().
 * - Timely: cubre navegación del carrusel hacia atrás.
 *
 * Patrón AAA:
 * - Arrange: preparar carrusel simulado y posicionar índice en 1.
 * - Act: ejecutar anterior().
 * - Assert: validar retroceso y transform.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub para aislar dependencias.
 * - Dummy: carrusel simulado para representar el elemento visual.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { MisPlantasComponent } from '../mis-plantas';
import { AuthService } from '../../login/auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceStub {
  getMisPlantas() {
    return of([]);
  }
}

describe('HU11 Frontend - MisPlantasComponent - P15', () => {
  let component: MisPlantasComponent;
  let fixture: ComponentFixture<MisPlantasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MisPlantasComponent,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [{ provide: AuthService, useClass: AuthServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(MisPlantasComponent);
    component = fixture.componentInstance;
  });

  it('HU11F_P15 - Debe retroceder el carrusel cuando el índice actual es mayor que cero', () => {
    // ===================== ARRANGE =====================
    const items = [
      { clientWidth: 100 },
      { clientWidth: 100 },
      { clientWidth: 100 },
      { clientWidth: 100 }
    ];

    const carrusel = {
      style: { transform: 'translateX(-130px)' },
      querySelectorAll: () => items
    };

    (component as any).carruselRef = {
      nativeElement: carrusel
    };

    component.indiceActual = 1;

    // ======================= ACT =======================
    component.anterior();

    // ===================== ASSERT ======================
    expect(component.indiceActual).toBe(0);
    expect(carrusel.style.transform).toBe('translateX(-0px)');
  });
});