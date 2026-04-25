/**
 * HU11F - Visualización de plantas registradas
 * Escenario P5: Formato inesperado
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes } from '@angular/router';
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

    localStorage.clear(); // FIRST: evita contaminación entre pruebas
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU11F P5 - Debe asignar lista vacía si la respuesta no es un arreglo', () => {
    // ===================== ARRANGE =====================
    // Se prepara una sesión válida, pero el servicio responde con formato inesperado
    // FIRST: no se usa backend real porque AuthService responde con un valor controlado
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        ID_USUARIO: 1,
        NOMBRE: 'Juliana'
      })
    );

    // ======================= ACT =======================
    // Se inicializa el componente para validar el manejo de respuestas no válidas
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(component.nombreUsuario).toBe('Juliana');
    // Fluent assertion: valida que el nombre del usuario se toma desde localStorage

    expect(component.plantas).toEqual([]);
    // Fluent assertion: valida que una respuesta inesperada se transforma en lista vacía

    expect(component.plantas).toHaveSize(0);
    // Fluent assertion: confirma que no se cargan plantas con una respuesta inválida

    expect(component.page).toBe(1);
    // Fluent assertion: valida que la paginación permanece en la primera página

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});