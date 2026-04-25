/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P8: Respuesta exitosa con user como arreglo
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

class AuthServiceP8Stub {
  login() {
    return of({
      user: [
        {
          ID_USUARIO: 3,
          nombre: 'Juliana',
          correo_electronico: 'juliana@gmail.com'
        }
      ]
    });
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P8', () => {
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
        { provide: AuthService, useClass: AuthServiceP8Stub },
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

  it('HU3F_P8 - Debe tomar el primer usuario del arreglo y navegar a /mis-plantas', () => {
    // ===================== ARRANGE =====================
    // Se prepara una respuesta donde user llega como arreglo para cubrir res.user?.[0] || res.user
    // FIRST: el resultado es repetible porque el stub siempre devuelve el mismo arreglo
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
    // Se ejecuta el flujo de inicio de sesión
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    expect(preventDefaultEjecutado).toBeTrue();
    // Fluent assertion: expresa claramente que preventDefault fue ejecutado

    expect(alertSpy).toHaveBeenCalledOnceWith('Bienvenid@ Juliana');
    // Fluent assertion: valida que el nombre usado sale del primer elemento del arreglo

    expect(navigateSpy).toHaveBeenCalledOnceWith(['/mis-plantas']);
    // Fluent assertion: valida la navegación exacta esperada para usuario normal

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: confirma que la sesión se guardó una sola vez

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');

    expect(usuarioGuardado).toEqual({
      ID_USUARIO: 3,
      nombre: 'Juliana',
      correo_electronico: 'juliana@gmail.com'
    });
    // Fluent assertion: valida el contrato completo del usuario tomado desde el arreglo

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});