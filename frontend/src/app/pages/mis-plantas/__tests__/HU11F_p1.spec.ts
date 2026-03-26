/**
 * HU11F - Visualización de plantas registradas
 * Escenario P1: Sesión inválida
 *
 * Objetivo de la prueba:
 * Verificar que, si no existe una sesión válida, el componente muestre
 * una alerta y redirija al usuario al login.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa datos controlados.
 * - Self-validating: valida resultados con expect().
 * - Timely: cubre la validación de sesión.
 *
 * Patrón AAA:
 * - Arrange: preparar entorno sin sesión y espiar alerta y navegación.
 * - Act: ejecutar ngOnInit().
 * - Assert: validar mensaje y redirección.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub para aislar dependencias.
 * - Spy: window.alert para validar el mensaje.
 * - Spy: router.navigate para validar navegación.
 * - Dummy: DummyComponent para rutas de prueba.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
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

describe('HU11 Frontend - MisPlantasComponent - P1', () => {
  let component: MisPlantasComponent;
  let fixture: ComponentFixture<MisPlantasComponent>;
  let router: Router;

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
    router = TestBed.inject(Router);

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU11F_P1 - Debe mostrar alerta y navegar a /login si la sesión es inválida', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');

    // ======================= ACT =======================
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('Sesión inválida. Inicia sesión nuevamente.');
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});