/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P1: Campos obligatorios vacíos
 *
 * Objetivo de la prueba:
 * Verificar que el método onLoginSubmit() detenga el flujo cuando
 * el correo o la contraseña están vacíos después de aplicar trim(),
 * evitando el inicio de sesión, la navegación y el almacenamiento de sesión.
 *
 * Principios FIRST:
 * - Fast: no depende de backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: siempre produce el mismo resultado.
 * - Self-validating: valida el resultado con expect().
 * - Timely: prueba directamente una unidad concreta del componente.
 *
 * Patrón AAA:
 * - Arrange: preparar inputs vacíos y el evento submit.
 * - Act: ejecutar onLoginSubmit().
 * - Assert: validar alerta, corte del flujo y ausencia de navegación.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceP1Stub. Se usa para garantizar que login() no debe ejecutarse.
 * - Spy: sobre window.alert para verificar el mensaje mostrado.
 * - Spy: sobre router.navigate para comprobar que no hubo navegación.
 * - Dummy: DummyComponent para definir rutas de prueba.
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

class AuthServiceP1Stub {
  login() {
    throw new Error('En P1 no se debe invocar login() porque el flujo debe cortar por validación.');
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P1', () => {
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
        { provide: AuthService, useClass: AuthServiceP1Stub },
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

  it('HU3F_P1 - Debe mostrar alerta y cortar el flujo si correo o contraseña están vacíos', () => {
    // ===================== ARRANGE =====================
    component.loginCorreo = '   ';
    component.loginContrasena = '   ';

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
    expect(alertSpy).toHaveBeenCalledWith('Ingresa tu correo y contraseña.');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('usuario')).toBeNull();
  });
});