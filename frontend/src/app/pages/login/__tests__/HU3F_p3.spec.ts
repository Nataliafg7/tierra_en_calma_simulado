/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P3: Inicio de sesión exitoso como usuario normal
 *
 * Objetivo de la prueba:
 * Verificar que onLoginSubmit() procese correctamente un login exitoso
 * de un usuario no administrador, guardando la sesión, mostrando
 * bienvenida y navegando a /mis-plantas.
 *
 * Principios FIRST:
 * - Fast: no depende de backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: usa una respuesta fija y controlada.
 * - Self-validating: valida el resultado con expect().
 * - Timely: cubre una rama específica del método.
 *
 * Patrón AAA:
 * - Arrange: preparar credenciales, spies y entorno.
 * - Act: ejecutar onLoginSubmit().
 * - Assert: validar persistencia, alerta y navegación.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceP3Stub para simular respuesta exitosa.
 * - Spy: sobre window.alert.
 * - Spy: sobre router.navigate.
 * - Spy: sobre localStorage.setItem.
 * - Dummy: DummyComponent para rutas.
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

  register() { return of({}); }
  recuperarContrasena() { return of({}); }
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
    expect(usuario.NOMBRE).toBe('Juliana');
    expect(usuario.CORREO_ELECTRONICO).toBe('juliana@gmail.com');
  });
});