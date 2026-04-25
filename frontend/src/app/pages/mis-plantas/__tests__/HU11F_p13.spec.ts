/**
 * HU11F - Visualización de plantas registradas
 * Escenario P13: Navegación por tipo Dólar
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

describe('HU11 Frontend - MisPlantasComponent - P13', () => {
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

  it('HU11F P13 - Debe invocar irADolar cuando la planta corresponde a ese tipo', () => {
    // ===================== ARRANGE =====================
    // Se prepara una planta tipo "Dólar" y se espía el método de navegación correspondiente
    // FIRST: no se usa backend real porque solo se valida lógica interna del componente
    const irADolarSpy = spyOn(component, 'irADolar');

    const planta = {
      ID_PLANTA: 2,
      NOMBRE_COMUN: 'Dólar',
      NOMBRE_CIENTIFICO: 'Plectranthus'
    };

    // ======================= ACT =======================
    // Se ejecuta el método que decide la navegación según el tipo de planta
    component.irPlanta(planta);

    // ===================== ASSERT ======================
    expect(irADolarSpy).toHaveBeenCalled();
    // Fluent assertion: valida que se invoca la navegación específica para plantas tipo Dólar

    expect(irADolarSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que el método se ejecuta exactamente una vez

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});