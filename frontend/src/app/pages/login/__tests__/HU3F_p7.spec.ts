/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P7: Error genérico sin mensaje del backend
 *
 * Objetivo de la prueba:
 * Verificar que onLoginSubmit() muestre el mensaje genérico
 * "Credenciales inválidas." cuando ocurre un error distinto de status 0
 * y el backend no envía err.error.message.
 *
 * Principios FIRST:
 * - Fast: no depende de backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa un error controlado.
 * - Self-validating: valida con expect().
 * - Timely: cubre la rama final del manejo de errores.
 *
 * Patrón AAA:
 * - Arrange: preparar credenciales, stub y spies.
 * - Act: ejecutar onLoginSubmit().
 * - Assert: validar mensaje genérico y ausencia de navegación/sesión.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceP7Stub.
 * - Spy: sobre window.alert.
 * - Spy: sobre router.navigate.
 * - Dummy: DummyComponent.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceP7Stub {
  login() {
    return throwError(() => ({
      status: 401,
      error: {}
    }));
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P7', () => {
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
        { provide: AuthService, useClass: AuthServiceP7Stub },
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

  it('HU3F_P7 - Debe mostrar mensaje genérico cuando no existe err.error.message', () => {
    // ===================== ARRANGE =====================
    component.loginCorreo = 'usuario@correo.com';
    component.loginContrasena = '123456';

    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');

    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    expect(preventDefaultEjecutado).toBeTrue();
    expect(alertSpy).toHaveBeenCalledWith('Credenciales inválidas.');
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});