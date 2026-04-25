/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P1: Campos obligatorios vacíos
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceP1Stub {
  login() {
    throw new Error('No debe ejecutarse login() cuando los campos obligatorios están vacíos.');
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P1', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'admin', component: DummyComponent },
      { path: 'mis-plantas', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes(routes)],
      providers: [
        { provide: AuthService, useClass: AuthServiceP1Stub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU3F_P1 - Debe mostrar alerta y cortar el flujo si correo o contraseña están vacíos', () => {
    // ===================== ARRANGE =====================
    // Se preparan campos con espacios para validar que trim() los trate como vacíos
    // FIRST: no depende de backend real porque AuthService está reemplazado por un stub
    component.loginCorreo = '   ';
    component.loginContrasena = '   ';

    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');

    let preventDefaultEjecutado = false;

    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    // Se ejecuta el método principal del formulario de login
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    // Se valida que el submit del formulario se detenga correctamente
    expect(preventDefaultEjecutado).toBeTrue();
    // Fluent assertion: expresa claramente que preventDefault sí fue ejecutado

    // Se valida que el usuario reciba el mensaje esperado por campos vacíos
    expect(alertSpy).toHaveBeenCalledOnceWith('Ingresa tu correo y contraseña.');
    // Fluent assertion: valida el contrato exacto del mensaje mostrado al usuario

    // Se valida que no exista navegación porque el login no debe continuar
    expect(navigateSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que el flujo se cortó antes de redirigir

    // Se valida que no se guarde sesión cuando los datos son inválidos
    expect(localStorage.getItem('usuario')).toBeNull();
    // Fluent assertion: confirma que no se creó información de sesión inválida

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});