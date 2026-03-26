/**
 * HU11F - Visualización de plantas registradas
 * Escenario P13: Navegación por tipo Dólar
 *
 * Objetivo de la prueba:
 * Verificar que al identificar una planta tipo Dólar
 * se invoque el método de navegación correspondiente.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa entrada controlada.
 * - Self-validating: valida llamada con expect().
 * - Timely: cubre navegación por tipo de planta.
 *
 * Patrón AAA:
 * - Arrange: preparar planta tipo Dólar y espiar método.
 * - Act: ejecutar irPlanta().
 * - Assert: validar invocación de irADolar().
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub para aislar dependencias.
 * - Spy: método irADolar para validar el flujo.
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

describe('HU11 Frontend - MisPlantasComponent - P13', () => {
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

  it('HU11F_P13 - Debe invocar irADolar cuando la planta corresponde a ese tipo', () => {
    // ===================== ARRANGE =====================
    const irADolarSpy = spyOn(component, 'irADolar');
    const planta = {
      ID_PLANTA: 2,
      NOMBRE_COMUN: 'Dólar',
      NOMBRE_CIENTIFICO: 'Plectranthus'
    };

    // ======================= ACT =======================
    component.irPlanta(planta);

    // ===================== ASSERT ======================
    expect(irADolarSpy).toHaveBeenCalled();
  });
});