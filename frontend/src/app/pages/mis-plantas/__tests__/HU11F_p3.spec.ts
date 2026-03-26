/**
 * HU11F - Visualización de plantas registradas
 * Escenario P3: Lista vacía
 *
 * Objetivo de la prueba:
 * Verificar que el componente maneje correctamente una respuesta vacía
 * sin producir errores.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa datos controlados.
 * - Self-validating: valida resultados con expect().
 * - Timely: cubre la ausencia de plantas.
 *
 * Patrón AAA:
 * - Arrange: preparar sesión válida y respuesta vacía.
 * - Act: ejecutar ngOnInit().
 * - Assert: validar lista vacía.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub con lista vacía.
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

describe('HU11 Frontend - MisPlantasComponent - P3', () => {
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

  it('HU11F_P3 - Debe manejar correctamente una lista vacía de plantas', () => {
    // ===================== ARRANGE =====================
    localStorage.setItem('usuario', JSON.stringify({
      ID_USUARIO: 1,
      NOMBRE: 'Juliana'
    }));

    // ======================= ACT =======================
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(component.nombreUsuario).toBe('Juliana');
    expect(component.plantas).toEqual([]);
    expect(component.page).toBe(1);
  });
});