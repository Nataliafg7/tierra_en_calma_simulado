import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceNoConexionStub {
  login() {
    return throwError(() => ({
      status: 0
    }));
  }

  register() {
    return of({});
  }

  recuperarContrasena() {
    return of({});
  }
}

describe('HU3 Frontend - LoginComponent - P11', () => {
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
        { provide: AuthService, useClass: AuthServiceNoConexionStub },
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

  it('HU3F_P11 - Debe mostrar error de conexión', () => {
    // ===================== ARRANGE =====================
    // Se preparan credenciales válidas para que el fallo ocurra solo por conexión
    // FIRST: el error status 0 está controlado con throwError, sin backend real
    component.loginCorreo = 'test@gmail.com';
    component.loginContrasena = '1234';

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
    // Fluent assertion: valida que el formulario detuvo el comportamiento por defecto

    expect(alertSpy).toHaveBeenCalledOnceWith(
      'No se pudo conectar con el servidor. Verifica el backend.'
    );
    // Fluent assertion: valida el mensaje exacto para error de conexión status 0

    expect(setItemSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no se guarda sesión cuando no hay conexión

    expect(localStorage.getItem('usuario')).toBeNull();
    // Fluent assertion: valida que no exista usuario persistido en localStorage

    expect(navigateSpy).not.toHaveBeenCalled();
    // Fluent assertion: confirma que no hay navegación cuando falla la conexión

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});