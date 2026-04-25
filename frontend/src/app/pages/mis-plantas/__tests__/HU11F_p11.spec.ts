/**
 * HU11F - Visualización de plantas registradas
 * Escenario P11: Clase visual por defecto
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

describe('HU11 Frontend - MisPlantasComponent - P11', () => {
  let component: MisPlantasComponent;
  let fixture: ComponentFixture<MisPlantasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MisPlantasComponent,
        RouterTestingModule,
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

  it('HU11F P11 - Debe devolver la clase por defecto para una planta no mapeada', () => {
    // ===================== ARRANGE =====================
    // Se prepara una planta que no coincide con ningún mapeo definido
    // FIRST: no se usa backend real porque solo se evalúa lógica interna del componente
    const planta = {
      ID_PLANTA: 99,
      NOMBRE_COMUN: 'Rosa',
      NOMBRE_CIENTIFICO: 'Rosa sp'
    };

    // ======================= ACT =======================
    // Se ejecuta el método encargado de asignar la clase visual
    const clase = component.plantClass(planta);

    // ===================== ASSERT ======================
    expect(clase).toBe('ceriman-card');
    // Fluent assertion: valida que se retorna la clase por defecto cuando no hay coincidencia

    expect(typeof clase).toBe('string');
    // Fluent assertion: confirma que siempre se retorna una clase válida tipo string

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});