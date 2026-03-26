/**
 * HU3F - Inicio de sesión (Frontend Angular)
 * Escenario P2: Inicio de sesión exitoso como administrador
 *
 * Objetivo de la prueba:
 * Verificar que onLoginSubmit() procese correctamente una respuesta exitosa,
 * guarde el usuario en localStorage, muestre el mensaje de bienvenida
 * y navegue a la ruta /admin cuando el correo corresponde al administrador.
 *
 * Principios FIRST:
 * - Fast: no usa backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: trabaja con respuesta controlada.
 * - Self-validating: usa expect() para validar resultados.
 * - Timely: cubre el camino exitoso del login administrador.
 *
 * Patrón AAA:
 * - Arrange: preparar credenciales válidas, spies y entorno.
 * - Act: ejecutar onLoginSubmit().
 * - Assert: validar alerta, almacenamiento y navegación.
 *
 * Tipo de double usado:
 * - Stub: AuthServiceP2Stub, devuelve una respuesta exitosa controlada.
 * - Spy: sobre window.alert para validar el mensaje.
 * - Spy: sobre router.navigate para validar navegación.
 * - Spy: sobre localStorage.setItem para verificar persistencia.
 * - Dummy: DummyComponent para las rutas de prueba.
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