/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P4: Respuesta exitosa pero usuario inválido
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
    // Se prepara una respuesta con user incompleto, sin NOMBRE ni nombre
    // FIRST: el resultado es repetible porque el stub siempre devuelve el mismo usuario inválido
    component.loginCorreo = 'usuario@correo.com';
    component.loginContrasena = '123456';

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
    // Se ejecuta el flujo de inicio de sesión
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    // Se valida que el formulario detenga el comportamiento por defecto
    expect(preventDefaultEjecutado).toBeTrue();
    // Fluent assertion: expresa claramente que preventDefault fue ejecutado

    expect(alertSpy).toHaveBeenCalledOnceWith('Credenciales inválidas. Verifica tu correo o contraseña.');
    // Fluent assertion: valida el mensaje exacto cuando el backend devuelve un usuario incompleto

    expect(setItemSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no se intenta persistir una sesión inválida

    expect(localStorage.getItem('usuario')).toBeNull();
    // Fluent assertion: valida que no exista usuario almacenado en localStorage

    expect(navigateSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no hay navegación cuando el usuario no es válido

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});