/**
 * HU11F - Visualización de plantas registradas
 * Escenario P9: Navegación a registrar nueva planta
 *
 * Objetivo de la prueba:
 * Verificar que el componente navegue correctamente
 * a la vista de registrar plantas.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa un entorno controlado.
 * - Self-validating: valida navegación con expect().
 * - Timely: cubre un flujo funcional directo.
 *
 * Patrón AAA:
 * - Arrange: preparar spy de navegación.
 * - Act: ejecutar registrarNuevaPlanta().
 * - Assert: validar ruta destino.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub para aislar dependencias.
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

describe('HU11 Frontend - MisPlantasComponent - P9', () => {
  let component: MisPlantasComponent;
  let fixture: ComponentFixture<MisPlantasComponent>;
  let router: Router;

  beforeEach(async () => {
    const routes: Routes = [
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
  });

  it('HU11F_P9 - Debe navegar a la vista de registrar plantas', () => {
    // ===================== ARRANGE =====================
    const navigateSpy = spyOn(router, 'navigate');

    // ======================= ACT =======================
    component.registrarNuevaPlanta();

    // ===================== ASSERT ======================
    expect(navigateSpy).toHaveBeenCalledWith(['/registrar-plantas']);
  });
});