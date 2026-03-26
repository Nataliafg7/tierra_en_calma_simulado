/**
 * HU11F - Visualización de plantas registradas
 * Escenario P11: Clase visual por defecto
 *
 * Objetivo de la prueba:
 * Verificar que el componente retorne la clase por defecto
 * cuando la planta no coincida con ningún mapeo definido.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa entrada controlada.
 * - Self-validating: valida el resultado con expect().
 * - Timely: cubre el caso por defecto del mapeo.
 *
 * Patrón AAA:
 * - Arrange: preparar planta no mapeada.
 * - Act: ejecutar plantClass().
 * - Assert: validar clase por defecto.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub para aislar dependencias.
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

describe('HU11 Frontend - MisPlantasComponent - P11', () => {
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

  it('HU11F_P11 - Debe devolver la clase por defecto para una planta no mapeada', () => {
    // ===================== ARRANGE =====================
    const planta = {
      ID_PLANTA: 99,
      NOMBRE_COMUN: 'Rosa',
      NOMBRE_CIENTIFICO: 'Rosa sp'
    };

    // ======================= ACT =======================
    const clase = component.plantClass(planta);

    // ===================== ASSERT ======================
    expect(clase).toBe('ceriman-card');
  });
});