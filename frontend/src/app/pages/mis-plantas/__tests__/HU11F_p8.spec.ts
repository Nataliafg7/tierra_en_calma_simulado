/**
 * HU11F - Visualización de plantas registradas
 * Escenario P8: Error del backend en monitoreo
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
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

    localStorage.clear(); // FIRST: evita contaminación entre pruebas
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('HU11F P8 - Debe mostrar alerta si el backend falla al preparar el monitoreo', () => {
    // ===================== ARRANGE =====================
    // Se prepara una planta válida y se simula un error del backend al preparar el monitoreo
    // FIRST: no se usa backend real porque la petición HTTP se controla con HttpTestingController
    const alertSpy = spyOn(window, 'alert');

    const planta = {
      ID_PLANTA_USUARIO: 25,
      ID_PLANTA: 1,
      NOMBRE_COMUN: 'Monstera',
      NOMBRE_CIENTIFICO: 'Monstera deliciosa'
    };

    // ======================= ACT =======================
    // Se ejecuta el método monitorear para generar la petición HTTP
    component.monitorear(planta);

    const req = httpMock.expectOne('http://localhost:3000/api/monitorear');

    expect(req.request.method).toBe('POST');
    // Fluent assertion: valida que el monitoreo se prepara mediante una petición POST

    expect(req.request.body).toEqual({
      id_planta_usuario: 25
    });
    // Fluent assertion: valida que se envía el ID correcto de la planta del usuario

    req.flush('Error', {
      status: 500,
      statusText: 'Server Error'
    });

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('No se pudo preparar el monitoreo.');
    // Fluent assertion: valida que se informa al usuario cuando falla el backend

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});