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

class AuthServiceSpy {
  login() {
    return of({});
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P9', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;
  let authService: AuthService;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'admin', component: DummyComponent },
      { path: 'mis-plantas', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes(routes)],
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
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
    authService = TestBed.inject(AuthService);

    await router.navigateByUrl('/');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('HU3F_P9 - No debe llamar login si campos están vacíos', () => {
    // ===================== ARRANGE =====================
    // Se preparan campos vacíos para validar que el flujo se corte antes de llamar al servicio
    // FIRST: no depende de backend real porque AuthService está controlado por un double
    component.loginCorreo = '';
    component.loginContrasena = '';

    const alertSpy = spyOn(window, 'alert');
    const loginSpy = spyOn(authService, 'login').and.callThrough();

    let preventDefaultEjecutado = false;

    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    // Se ejecuta el envío del formulario de inicio de sesión
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    expect(preventDefaultEjecutado).toBeTrue();
    // Fluent assertion: expresa claramente que el formulario detuvo el comportamiento por defecto

    expect(alertSpy).toHaveBeenCalledOnceWith('Ingresa tu correo y contraseña.');
    // Fluent assertion: valida el mensaje exacto mostrado cuando faltan campos obligatorios

    expect(loginSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no se llama AuthService.login cuando la validación inicial falla

    expect(localStorage.getItem('usuario')).toBeNull();
    // Fluent assertion: valida que no se cree sesión con datos inválidos

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});