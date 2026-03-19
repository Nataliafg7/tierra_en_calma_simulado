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

/**
 * Servicio controlado para P4:
 * Devuelve un user SIN NOMBRE ni nombre.
 * Esto fuerza la rama "usuario inválido".
 */
class AuthServiceP4 {
  login() {
    return of({
      user: {
        CORREO_ELECTRONICO: 'usuario@correo.com'
        // Intencionalmente NO tiene NOMBRE ni nombre
      }
    });
  }

  register() { return of(); }
  recuperarContrasena() { return of(); }
}

describe('HU3 Frontend - LoginComponent - P4 (Usuario inválido sin nombre)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'mis-plantas', component: DummyComponent },
      { path: 'admin', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes(routes)],
      providers: [
        { provide: AuthService, useClass: AuthServiceP4 },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            queryParams: {
              subscribe: (fn: any) => {
                const subscription = { unsubscribe: () => {} };
                setTimeout(() => fn({}), 0);
                return subscription;
              }
            }
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

  afterEach(() => localStorage.clear());

  it('P4: debe mostrar alerta de credenciales inválidas y NO guardar sesión ni navegar', () => {

    component.loginCorreo = 'usuario@correo.com';
    component.loginContrasena = '123456';

    const originalAlert = window.alert;
    let alertCapturado = '';
    window.alert = (msg: any) => { alertCapturado = String(msg); };

    const fakeEvent = { preventDefault: () => {} } as unknown as Event;

    component.onLoginSubmit(fakeEvent);
    fixture.detectChanges();

    // Assertions
    expect(alertCapturado).toBe('Credenciales inválidas. Verifica tu correo o contraseña.');
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(router.url).toBe('/');

    window.alert = originalAlert;
  });
});