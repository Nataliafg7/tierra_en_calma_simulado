/**
 * HU11F - Visualización de plantas registradas
 * Escenario P9: Navegación a registrar nueva planta
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

    localStorage.clear(); // FIRST: evita contaminación entre pruebas
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU11F P9 - Debe navegar a la vista de registrar plantas', () => {
    // ===================== ARRANGE =====================
    // Se prepara el spy de navegación para verificar la ruta destino
    // FIRST: no se usa backend real porque solo se valida navegación interna
    const navigateSpy = spyOn(router, 'navigate');

    // ======================= ACT =======================
    // Se ejecuta el método encargado de llevar al usuario a registrar una nueva planta
    component.registrarNuevaPlanta();

    // ===================== ASSERT ======================
    expect(navigateSpy).toHaveBeenCalledWith(['/registrar-plantas']);
    // Fluent assertion: valida que el componente navega a la vista de registrar plantas

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la navegación se ejecuta una sola vez

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});