/**
 * HU11F - Visualización de plantas registradas
 * Escenario P2: Carga exitosa
 *
 * Objetivo de la prueba:
 * Verificar que el componente cargue correctamente las plantas
 * cuando existe una sesión válida y el servicio responde con datos.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa respuesta controlada.
 * - Self-validating: valida resultados con expect().
 * - Timely: cubre el flujo exitoso de carga.
 *
 * Patrón AAA:
 * - Arrange: preparar sesión válida y respuesta del servicio.
 * - Act: ejecutar ngOnInit().
 * - Assert: validar nombre, lista y página.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub con respuesta exitosa.
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
    return of([
      {
        ID_PLANTA_USUARIO: 10,
        ID_PLANTA: 1,
        NOMBRE_COMUN: 'Monstera',
        NOMBRE_CIENTIFICO: 'Monstera deliciosa'
      }
    ]);
  }
}

describe('HU11 Frontend - MisPlantasComponent - P2', () => {
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

  it('HU11F_P2 - Debe cargar correctamente las plantas del usuario', () => {
    // ===================== ARRANGE =====================
    localStorage.setItem('usuario', JSON.stringify({
      ID_USUARIO: 1,
      NOMBRE: 'Juliana'
    }));

    // ======================= ACT =======================
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(component.nombreUsuario).toBe('Juliana');
    expect(component.plantas.length).toBe(1);
    expect(component.plantas[0].NOMBRE_COMUN).toBe('Monstera');
    expect(component.page).toBe(1);
    expect(component.indiceActual).toBe(0);
  });
});