/**
 * HU11F - Visualización de plantas registradas
 * Escenario P14: Avance del carrusel
 *
 * Objetivo de la prueba:
 * Verificar que el carrusel avance correctamente
 * cuando existen elementos suficientes para desplazar.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa un carrusel simulado.
 * - Self-validating: valida índice y transform con expect().
 * - Timely: cubre navegación del carrusel hacia adelante.
 *
 * Patrón AAA:
 * - Arrange: preparar carrusel simulado con elementos.
 * - Act: ejecutar siguiente().
 * - Assert: validar desplazamiento.
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

describe('HU11 Frontend - MisPlantasComponent - P14', () => {
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

  it('HU11F_P14 - Debe avanzar el carrusel cuando hay elementos suficientes', () => {
    // ===================== ARRANGE =====================
    const items = [
      { clientWidth: 100 },
      { clientWidth: 100 },
      { clientWidth: 100 },
      { clientWidth: 100 }
    ];

    const carrusel = {
      style: { transform: 'translateX(0px)' },
      querySelectorAll: () => items
    };

    (component as any).carruselRef = {
      nativeElement: carrusel
    };

    // ======================= ACT =======================
    component.siguiente();

    // ===================== ASSERT ======================
    expect(component.indiceActual).toBe(1);
    expect(carrusel.style.transform).toBe('translateX(-130px)');
  });
});