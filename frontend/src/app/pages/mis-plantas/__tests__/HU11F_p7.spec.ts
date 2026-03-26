/**
 * HU11F - Visualización de plantas registradas
 * Escenario P7: Planta inválida en monitoreo
 *
 * Objetivo de la prueba:
 * Verificar que si la planta no tiene un ID_PLANTA_USUARIO válido,
 * el componente muestre una alerta y no continúe el flujo.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa datos controlados.
 * - Self-validating: valida resultados con expect().
 * - Timely: cubre validación de entrada del monitoreo.
 *
 * Patrón AAA:
 * - Arrange: preparar planta inválida y espiar alerta.
 * - Act: ejecutar monitorear().
 * - Assert: validar mensaje.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub para aislar dependencias.
 * - Spy: window.alert para validar el mensaje.
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

describe('HU11 Frontend - MisPlantasComponent - P7', () => {
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

  it('HU11F_P7 - Debe mostrar alerta si la planta es inválida', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');
    const planta = {
      ID_PLANTA_USUARIO: 0,
      ID_PLANTA: 1,
      NOMBRE_COMUN: 'Monstera',
      NOMBRE_CIENTIFICO: 'Monstera deliciosa'
    };

    // ======================= ACT =======================
    component.monitorear(planta);

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('Planta inválida (falta ID_PLANTA_USUARIO)');
  });
});