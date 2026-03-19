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

class AuthServiceP5 {
  login() {
    return throwError(() => ({
      status: 0
    }));
  }

  register() { return throwError(() => ({})); }
  recuperarContrasena() { return throwError(() => ({})); }
}

describe('HU3 Frontend - LoginComponent - P5 (Error status 0)', () => {
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
        { provide: AuthService, useClass: AuthServiceP5 },
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

  it('P5: debe mostrar mensaje de error de conexión cuando err.status === 0', () => {

    component.loginCorreo = 'usuario@correo.com';
    component.loginContrasena = '123456';

    const originalAlert = window.alert;
    let alertCapturado = '';
    window.alert = (msg: any) => { alertCapturado = String(msg); };

    const fakeEvent = { preventDefault: () => {} } as unknown as Event;

    component.onLoginSubmit(fakeEvent);
    fixture.detectChanges();

    expect(alertCapturado).toBe('No se pudo conectar con el servidor. Verifica el backend.');
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(router.url).toBe('/');

    window.alert = originalAlert;
  });
});