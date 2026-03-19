import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { throwError } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceP6 {
  login() {
    return throwError(() => ({
      status: 401,
      error: { message: 'Credenciales inválidas. Usuario o contraseña incorrectos.' }
    }));
  }

  register() { return throwError(() => ({})); }
  recuperarContrasena() { return throwError(() => ({})); }
}

describe('HU3 Frontend - LoginComponent - P6 (Error con message del backend)', () => {
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
        { provide: AuthService, useClass: AuthServiceP6 },
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

  it('P6: debe mostrar el mensaje específico del backend cuando err.error.message existe', () => {
    component.loginCorreo = 'usuario@correo.com';
    component.loginContrasena = '123456';

    const originalAlert = window.alert;
    let alertCapturado = '';
    window.alert = (msg: any) => { alertCapturado = String(msg); };

    const fakeEvent = { preventDefault: () => {} } as unknown as Event;

    component.onLoginSubmit(fakeEvent);
    fixture.detectChanges();

    expect(alertCapturado).toBe('Credenciales inválidas. Usuario o contraseña incorrectos.');
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(router.url).toBe('/');

    window.alert = originalAlert;
  });
});