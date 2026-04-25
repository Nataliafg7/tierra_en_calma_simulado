/**
 * HU11F - Visualización de plantas registradas
 * Escenario P2: Carga exitosa
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Routes } from '@angular/router';
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

    localStorage.clear(); // FIRST: evita contaminación entre pruebas
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU11F P2 - Debe cargar correctamente las plantas del usuario', () => {
    // ===================== ARRANGE =====================
    // Se prepara una sesión válida con usuario almacenado
    // FIRST: no se usa backend real porque AuthService responde con datos controlados
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        ID_USUARIO: 1,
        NOMBRE: 'Juliana'
      })
    );

    // ======================= ACT =======================
    // Se inicializa el componente para cargar las plantas del usuario
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(component.nombreUsuario).toBe('Juliana');
    // Fluent assertion: valida que el nombre del usuario se toma desde localStorage

    expect(component.plantas).toHaveSize(1);
    // Fluent assertion: valida que se cargó una planta asociada al usuario

    expect(component.plantas[0]).toEqual(
      jasmine.objectContaining({
        ID_PLANTA_USUARIO: 10,
        ID_PLANTA: 1,
        NOMBRE_COMUN: 'Monstera',
        NOMBRE_CIENTIFICO: 'Monstera deliciosa'
      })
    );
    // Fluent assertion: valida la estructura y datos de la planta cargada

    expect(component.page).toBe(1);
    // Fluent assertion: valida que la paginación inicia en la primera página

    expect(component.indiceActual).toBe(0);
    // Fluent assertion: valida que el índice inicial queda en la primera planta

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});