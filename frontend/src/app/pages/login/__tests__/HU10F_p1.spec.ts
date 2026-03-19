import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

@Component({ standalone: true, template: '' })
class DummyMisPlantasComponent {}

describe('Pruebas Unitarias Frontend – HU10 Asociación de planta', () => {
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let component: RegistrarPlantasComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistrarPlantasComponent,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'login', component: DummyLoginComponent },
          { path: 'mis-plantas', component: DummyMisPlantasComponent },
        ]),
        DummyLoginComponent,
        DummyMisPlantasComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Escenario 1 (P1) – Debe alertar y navegar a /login si no hay sesión', fakeAsync(() => {
    // Precondición: no hay ID_USUARIO en localStorage
    localStorage.setItem('usuario', JSON.stringify({}));

    // Capturar alert
    let alertMsg = '';
    const originalAlert = window.alert;
    window.alert = (msg?: any) => { alertMsg = String(msg); };

    // Ejecutar
    component.anadirPlanta('monstera');

    // Restaurar alert
    window.alert = originalAlert;

    // Assertions
    expect(alertMsg).toBe('Debes iniciar sesión antes de añadir plantas');

    tick();
    expect(router.url).toBe('/login');
  }));
});