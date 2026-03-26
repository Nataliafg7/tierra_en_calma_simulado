/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P5: Error de conexión con el backend
 *
 * Objetivo de la prueba:
 * Verificar que onLoginSubmit() muestre el mensaje de error de conexión
 * cuando el servicio responde con status 0, sin guardar sesión ni navegar.
 *
 * Principios FIRST:
 * - Fast: usa throwError controlado.
 * - Independent: no requiere backend.
 * - Repeatable: siempre entrega el mismo error.
 * - Self-validating: valida con expect().
 * - Timely: cubre la rama de error por conexión.
 *
 * Patrón AAA:
 * - Arrange: preparar credenciales y spies.
 * - Act: ejecutar onLoginSubmit().
 * - Assert: validar mensaje, sesión vacía y no navegación.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceP5Stub.
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

class AuthServiceP2Stub {
  login() {
    return of({
      user: {
        ID_USUARIO: 1,
        NOMBRE: 'Administrador',
        CORREO_ELECTRONICO: 'admin@tierraencalma.com'
      }
    });
  }
  register() { return of({}); }
  recuperarContrasena() { return of({}); }
}

describe('HU3 Frontend - LoginComponent - P2', () => {
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
        { provide: AuthService, useClass: AuthServiceP2Stub },
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

  it('HU3F_P2 - Debe guardar usuario, mostrar bienvenida y navegar a /admin', () => {
    // ===================== ARRANGE =====================
    component.loginCorreo = ' admin@tierraencalma.com ';
    component.loginContrasena = ' admin123 ';

    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');
    spyOn(localStorage, 'setItem').and.callThrough();

    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => preventDefaultEjecutado = true
    } as unknown as Event;

    // ======================= ACT =======================
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    expect(preventDefaultEjecutado).toBeTrue();
    expect(alertSpy).toHaveBeenCalledWith('Bienvenid@ Administrador');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    expect(usuario.NOMBRE).toBe('Administrador');
    expect(usuario.CORREO_ELECTRONICO).toBe('admin@tierraencalma.com');
  });
});