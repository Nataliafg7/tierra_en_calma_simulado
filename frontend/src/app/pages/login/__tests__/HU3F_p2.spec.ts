/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P2: Inicio de sesión exitoso como administrador
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

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
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
    // Se preparan credenciales válidas con espacios para validar que el componente aplique trim()
    // FIRST: la respuesta del login está controlada por el stub, sin backend real
    component.loginCorreo = ' admin@tierraencalma.com ';
    component.loginContrasena = ' admin123 ';

    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();

    let preventDefaultEjecutado = false;

    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    // Se ejecuta el flujo de inicio de sesión desde el formulario
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    // Se valida que el formulario no recargue la página
    expect(preventDefaultEjecutado).toBeTrue();
    // Fluent assertion: expresa claramente que preventDefault fue ejecutado

    expect(alertSpy).toHaveBeenCalledOnceWith('Bienvenid@ Administrador');
    // Fluent assertion: valida el mensaje exacto mostrado al usuario administrador

    expect(navigateSpy).toHaveBeenCalledOnceWith(['/admin']);
    // Fluent assertion: valida la navegación exacta hacia el panel administrador

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la sesión se guardó una sola vez

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');

    expect(usuarioGuardado).toEqual({
      ID_USUARIO: 1,
      NOMBRE: 'Administrador',
      CORREO_ELECTRONICO: 'admin@tierraencalma.com'
    });
    // Fluent assertion: valida el contrato completo del usuario persistido en localStorage

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus expects
  });
});