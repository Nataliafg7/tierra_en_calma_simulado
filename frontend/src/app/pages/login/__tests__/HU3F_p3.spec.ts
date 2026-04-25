/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P3: Inicio de sesión exitoso como usuario normal
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

class AuthServiceP3Stub {
  login() {
    return of({
      user: {
        ID_USUARIO: 2,
        NOMBRE: 'Juliana',
        CORREO_ELECTRONICO: 'juliana@gmail.com'
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

describe('HU3 Frontend - LoginComponent - P3', () => {
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
        { provide: AuthService, useClass: AuthServiceP3Stub },
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

  it('HU3F_P3 - Debe guardar usuario, mostrar bienvenida y navegar a /mis-plantas', () => {
    // ===================== ARRANGE =====================
    // Se preparan credenciales válidas de un usuario normal, no administrador
    // FIRST: el login no depende del backend porque AuthService está controlado por un stub
    component.loginCorreo = ' juliana@gmail.com ';
    component.loginContrasena = ' 1234 ';

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
    // Se ejecuta el método del formulario de inicio de sesión
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    // Se valida que el formulario no haga recarga de página
    expect(preventDefaultEjecutado).toBeTrue();
    // Fluent assertion: expresa claramente que preventDefault fue ejecutado

    expect(alertSpy).toHaveBeenCalledOnceWith('Bienvenid@ Juliana');
    // Fluent assertion: valida el mensaje exacto de bienvenida para el usuario autenticado

    expect(navigateSpy).toHaveBeenCalledOnceWith(['/mis-plantas']);
    // Fluent assertion: valida la navegación exacta esperada para usuarios normales

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la sesión se persistió una sola vez

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');

    expect(usuarioGuardado).toEqual({
      ID_USUARIO: 2,
      NOMBRE: 'Juliana',
      CORREO_ELECTRONICO: 'juliana@gmail.com'
    });
    // Fluent assertion: valida el contrato completo del usuario guardado en localStorage

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});