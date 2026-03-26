/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P8: Respuesta exitosa con user como arreglo
 *
 * Objetivo de la prueba:
 * Verificar que onLoginSubmit() procese correctamente el caso en que
 * el backend devuelve res.user como un arreglo y no como un objeto directo.
 *
 * Este escenario ayuda a cubrir la expresión:
 * const usuario = res.user?.[0] || res.user;
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa una respuesta fija.
 * - Self-validating: comprueba resultados con expect().
 * - Timely: cubre un camino interno adicional del método.
 *
 * Patrón AAA:
 * - Arrange: preparar stub, credenciales y spies.
 * - Act: ejecutar onLoginSubmit().
 * - Assert: validar que toma el primer elemento del arreglo, guarda sesión y navega.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceP8Stub.
 * - Spy: sobre window.alert.
 * - Spy: sobre router.navigate.
 * - Spy: sobre localStorage.setItem.
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

  register() { return of({}); }
  recuperarContrasena() { return of({}); }
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
    component.loginCorreo = ' juliana@gmail.com ';
    component.loginContrasena = ' 1234 ';

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
    expect(alertSpy).toHaveBeenCalledWith('Bienvenid@ Juliana');
    expect(navigateSpy).toHaveBeenCalledWith(['/mis-plantas']);

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    expect(usuario.nombre).toBe('Juliana');
    expect(usuario.correo_electronico).toBe('juliana@gmail.com');
  });
});