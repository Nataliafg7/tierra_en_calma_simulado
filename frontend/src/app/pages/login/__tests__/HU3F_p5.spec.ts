/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P5: Error de conexión con el backend
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

class AuthServiceP5Stub {
  login() {
    return throwError(() => ({
      status: 0
    }));
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P5', () => {
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
        { provide: AuthService, useClass: AuthServiceP5Stub },
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

  it('HU3F_P5 - Debe mostrar error de conexión y no guardar sesión ni navegar', () => {
    // ===================== ARRANGE =====================
    // Se preparan credenciales válidas para que el fallo ocurra únicamente en la comunicación con el backend
    // FIRST: el error es controlado por el stub y no depende de un backend real
    component.loginCorreo = 'juliana@correo.com';
    component.loginContrasena = 'clave1234';

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
    expect(preventDefaultEjecutado).toBeTrue();
    // Fluent assertion: valida que el formulario detuvo el comportamiento por defecto

    expect(alertSpy).toHaveBeenCalledOnceWith('No se pudo conectar con el servidor. Verifica el backend.');
    // Fluent assertion: valida el mensaje exacto para error de conexión status 0

    expect(setItemSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no se guarda sesión cuando falla la conexión

    expect(localStorage.getItem('usuario')).toBeNull();
    // Fluent assertion: valida que no exista usuario persistido en localStorage

    expect(navigateSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no hay navegación si el login falla

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});