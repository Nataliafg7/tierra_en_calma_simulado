/**
 * HU11F - Visualización de plantas registradas
 * Escenario P4: Error del servicio
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { throwError } from 'rxjs';

import { MisPlantasComponent } from '../mis-plantas';
import { AuthService } from '../../login/auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceStub {
  getMisPlantas() {
    return throwError(() => new Error('Error al cargar plantas'));
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

    localStorage.clear(); // FIRST: evita contaminación entre pruebas
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU11F P4 - Debe mostrar alerta si ocurre un error al cargar las plantas', () => {
    // ===================== ARRANGE =====================
    // Se prepara una sesión válida, pero el servicio responde con error
    // FIRST: no se usa backend real porque el error se simula con un stub controlado
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        ID_USUARIO: 1,
        NOMBRE: 'Juliana'
      })
    );

    const alertSpy = spyOn(window, 'alert');

    // ======================= ACT =======================
    // Se inicializa el componente para cubrir el manejo de error del servicio
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('No fue posible cargar tus plantas.');
    // Fluent assertion: valida que se informa al usuario cuando falla la carga de plantas

    expect(component.nombreUsuario).toBe('Juliana');
    // Fluent assertion: valida que el usuario de sesión se conserva aunque falle el servicio

    expect(component.plantas).toHaveSize(0);
    // Fluent assertion: confirma que no se cargan plantas cuando el servicio falla

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});