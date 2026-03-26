/**
 * HU11F - Visualización de plantas registradas
 * Escenario P5: Formato inesperado
 *
 * Objetivo de la prueba:
 * Verificar que el componente asigne una lista vacía cuando la respuesta
 * del servicio no sea un arreglo.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa una respuesta controlada.
 * - Self-validating: valida resultados con expect().
 * - Timely: cubre el manejo de formatos inesperados.
 *
 * Patrón AAA:
 * - Arrange: preparar sesión válida y respuesta inválida.
 * - Act: ejecutar ngOnInit().
 * - Assert: validar lista vacía.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub con respuesta inesperada.
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
    return of(null as any);
  }
}

describe('HU11 Frontend - MisPlantasComponent - P5', () => {
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

  it('HU11F_P5 - Debe asignar lista vacía si la respuesta no es un arreglo', () => {
    // ===================== ARRANGE =====================
    localStorage.setItem('usuario', JSON.stringify({
      ID_USUARIO: 1,
      NOMBRE: 'Juliana'
    }));

    // ======================= ACT =======================
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(component.plantas).toEqual([]);
    expect(component.page).toBe(1);
  });
});