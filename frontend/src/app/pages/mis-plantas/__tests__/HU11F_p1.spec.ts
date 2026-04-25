/**
 * HU11F - Visualización de plantas registradas
 * Escenario P1: Sesión inválida
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

    localStorage.clear(); // FIRST: evita contaminación entre pruebas
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU11F P1 - Debe mostrar alerta y navegar a /login si la sesión es inválida', () => {
    // ===================== ARRANGE =====================
    // Se prepara el componente sin usuario en localStorage
    // FIRST: no se usa backend real porque AuthService está aislado con stub
    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');

    // ======================= ACT =======================
    // Se ejecuta la inicialización del componente sin sesión válida
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith(
      'Sesión inválida. Inicia sesión nuevamente.'
    );
    // Fluent assertion: valida que se informa al usuario que la sesión no es válida

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    // Fluent assertion: valida que el usuario es redirigido al login

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});