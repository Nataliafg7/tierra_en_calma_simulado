/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P4: Respuesta exitosa pero usuario inválido
 *
 * Objetivo de la prueba:
 * Verificar que onLoginSubmit() maneje correctamente una respuesta
 * donde el backend devuelve un objeto user sin NOMBRE ni nombre,
 * mostrando mensaje de credenciales inválidas y evitando guardar sesión o navegar.
 *
 * Principios FIRST:
 * - Fast: usa datos simulados.
 * - Independent: no depende de backend ni de otras pruebas.
 * - Repeatable: el resultado siempre es el mismo.
 * - Self-validating: se valida con expect().
 * - Timely: cubre la rama del usuario inválido.
 *
 * Patrón AAA:
 * - Arrange: preparar credenciales, stub y spies.
 * - Act: ejecutar onLoginSubmit().
 * - Assert: validar alerta, ausencia de sesión y no navegación.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceP4Stub.
 * - Spy: sobre window.alert.
 * - Spy: sobre router.navigate.
 * - Dummy: DummyComponent.
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

class AuthServiceP4Stub {
  login() {
    return of({
      user: {
        CORREO_ELECTRONICO: 'usuario@correo.com'
      }
    });
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P4', () => {
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
        { provide: AuthService, useClass: AuthServiceP4Stub },
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

  it('HU3F_P4 - Debe mostrar alerta de credenciales inválidas y no guardar sesión', () => {
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
    expect(alertSpy).toHaveBeenCalledWith('Credenciales inválidas. Verifica tu correo o contraseña.');
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});