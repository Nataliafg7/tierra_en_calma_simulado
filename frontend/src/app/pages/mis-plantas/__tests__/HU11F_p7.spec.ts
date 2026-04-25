/**
 * HU11F - Visualización de plantas registradas
 * Escenario P7: Planta inválida en monitoreo
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

describe('HU11 Frontend - MisPlantasComponent - P7', () => {
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

  it('HU11F P7 - Debe mostrar alerta si la planta es inválida', () => {
    // ===================== ARRANGE =====================
    // Se prepara una planta sin ID_PLANTA_USUARIO válido
    // FIRST: no se usa backend real porque solo se valida el flujo interno del componente
    const alertSpy = spyOn(window, 'alert');

    const planta = {
      ID_PLANTA_USUARIO: 0,
      ID_PLANTA: 1,
      NOMBRE_COMUN: 'Monstera',
      NOMBRE_CIENTIFICO: 'Monstera deliciosa'
    };

    // ======================= ACT =======================
    // Se intenta monitorear una planta inválida
    component.monitorear(planta);

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith(
      'Planta inválida (falta ID_PLANTA_USUARIO)'
    );
    // Fluent assertion: valida que se informa al usuario cuando la planta no tiene ID válido

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});