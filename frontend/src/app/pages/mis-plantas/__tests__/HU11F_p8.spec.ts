/**
 * HU11F - Visualización de plantas registradas
 * Escenario P8: Error del backend en monitoreo
 *
 * Objetivo de la prueba:
 * Verificar que si el backend falla al preparar el monitoreo,
 * el componente muestre la alerta correspondiente.
 *
 * Principios FIRST:
 * - Fast: usa entorno controlado.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: reproduce el error de forma estable.
 * - Self-validating: valida resultados con expect().
 * - Timely: cubre manejo de errores del monitoreo.
 *
 * Patrón AAA:
 * - Arrange: preparar planta válida, espiar alerta y capturar petición HTTP.
 * - Act: ejecutar monitorear() y responder con error.
 * - Assert: validar alerta.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceStub para aislar dependencias.
 * - Spy: window.alert para validar el mensaje.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
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

describe('HU11 Frontend - MisPlantasComponent - P8', () => {
  let component: MisPlantasComponent;
  let fixture: ComponentFixture<MisPlantasComponent>;
  let httpMock: HttpTestingController;

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
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('HU11F_P8 - Debe mostrar alerta si el backend falla al preparar el monitoreo', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');
    const planta = {
      ID_PLANTA_USUARIO: 25,
      ID_PLANTA: 1,
      NOMBRE_COMUN: 'Monstera',
      NOMBRE_CIENTIFICO: 'Monstera deliciosa'
    };

    // ======================= ACT =======================
    component.monitorear(planta);

    const req = httpMock.expectOne('http://localhost:3000/api/monitorear');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('No se pudo preparar el monitoreo.');
  });
});