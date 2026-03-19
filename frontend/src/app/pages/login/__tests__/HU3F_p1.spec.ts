import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

/**
 * AuthServiceGuard:
 * No es spy, no es mock de Jasmine.
 * Sirve como "barrera": si el flujo P1 está bien, NO se debe invocar login().
 * Si se invoca, lanzamos error para evidenciar que el componente NO cortó el flujo.
 */
class AuthServiceGuard {
  login(): any {
    throw new Error('P1 no debe llamar authService.login(): el flujo debe cortar por campos vacíos.');
  }
  register(): any {
    throw new Error('No aplica en P1.');
  }
  recuperarContrasena(): any {
    throw new Error('No aplica en P1.');
  }
}

describe('HU3 Frontend - LoginComponent - P1 (Campos vacíos)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'admin', component: DummyComponent },
      { path: 'mis-plantas', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      // LoginComponent es standalone: se importa directamente
      imports: [LoginComponent, RouterTestingModule.withRoutes(routes)],
      providers: [
        { provide: AuthService, useClass: AuthServiceGuard },

        /**
         * ActivatedRoute mínimo para que ngOnInit no falle al leer snapshot/queryParams.
         * No se espía nada, solo se cumple la inyección.
         */
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            queryParams: {
              subscribe: (fn: any) => {
                fn({}); // emite params vacíos
                return { unsubscribe: () => {} };
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    // Estabiliza el router para poder comparar URL antes/después
    await router.navigateByUrl('/');
    fixture.detectChanges();
  });

  afterEach(() => {
    // Limpieza: evita que una ejecución afecte otra
    localStorage.clear();
  });

  it('P1: debe mostrar alerta y cortar si correo o contraseña están vacíos (tras trim), sin navegar ni guardar usuario', () => {

    // Entrada: espacios => trim() => ''
    component.loginCorreo = '   ';
    component.loginContrasena = '   ';

    // Captura de alert SIN spyOn: reemplazo temporal controlado
    const originalAlert = window.alert;
    let alertCapturado = '';
    window.alert = (msg: any) => { alertCapturado = String(msg); };

    // Evento submit realista
    let preventDefaultLlamado = false;
    const fakeEvent = { preventDefault: () => { preventDefaultLlamado = true; } } as unknown as Event;

    // Estado antes de ejecutar
    const urlAntes = router.url;

    // Ejecución real del método
    component.onLoginSubmit(fakeEvent);
    fixture.detectChanges();

    // Assertions (expect)
    expect(preventDefaultLlamado).toBeTrue();
    expect(alertCapturado).toBe('Ingresa tu correo y contraseña.');
    expect(router.url).toBe(urlAntes);
    expect(localStorage.getItem('usuario')).toBeNull();

    // Restaurar alert para no afectar otras pruebas
    window.alert = originalAlert;
  });
});