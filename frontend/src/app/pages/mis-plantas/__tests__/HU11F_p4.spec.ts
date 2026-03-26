/**
 * HU11F - Visualización de plantas registradas
 * Escenario P4: Error del servicio
 *
 * Objetivo de la prueba:
 * Verificar que el componente muestre una alerta cuando ocurre
 * un error al cargar las plantas.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: simula el error de forma controlada.
 * - Self-validating: valida el mensaje con expect().
 * - Timely: cubre el manejo de errores.
 *
 * Patrón AAA:
 * - Arrange: preparar sesión válida y error controlado.
 * - Act: ejecutar ngOnInit().
 * - Assert: validar alerta.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub que dispara error.
 * - Spy: window.alert para validar el mensaje.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MisPlantasComponent } from '../mis-plantas';
import { AuthService } from '../../login/auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceStub {
  getMisPlantas() {
    return {
      subscribe: ({ error }: any) => {
        error();
      }
    };
  }
}

describe('HU11 Frontend - MisPlantasComponent - P4', () => {
  let component: MisPlantasComponent;
  let fixture: ComponentFixture<MisPlantasComponent>;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'login', component: DummyComponent },
      { path: 'monstera', component: DummyComponent },
      { path: 'registrar-plantas', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      imports: [
        MisPlantasComponent,
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule
      ],
      providers: [{ provide: AuthService, useClass: AuthServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(MisPlantasComponent);
    component = fixture.componentInstance;

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU11F_P4 - Debe mostrar alerta si ocurre un error al cargar las plantas', () => {
    // ===================== ARRANGE =====================
    localStorage.setItem('usuario', JSON.stringify({
      ID_USUARIO: 1,
      NOMBRE: 'Juliana'
    }));
    const alertSpy = spyOn(window, 'alert');

    // ======================= ACT =======================
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('No fue posible cargar tus plantas.');
  });
});