import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

describe('HU3 Frontend - LoginComponent - P2 (Login admin exitoso)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'admin', component: DummyComponent },
      { path: 'mis-plantas', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      /**
       * Importante:
       * - HttpClientModule => permite que AuthService haga la petición REAL al backend.
       * - NO usamos HttpClientTestingModule (eso sería mock).
       * - NO usamos spyOn.
       */
      imports: [LoginComponent, HttpClientModule, RouterTestingModule.withRoutes(routes)],
      providers: [
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            queryParams: {
              subscribe: (fn: any) => {
                fn({});
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

    await router.navigateByUrl('/');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('P2: debe guardar usuario, mostrar bienvenida y navegar a /admin cuando el correo es admin@tierraencalma.com', (done) => {
    /**
     * CASO P2 (Camino C2):
     * 1) Inputs válidos => pasa validación (NO entra al alert de campos vacíos)
     * 2) authService.login(credentials) responde por next con res.user válido
     * 3) usuario tiene NOMBRE o nombre => guarda en localStorage y alerta bienvenida
     * 4) correo === 'admin@tierraencalma.com' => navega a /admin
     *
     * Verificamos efectos reales (sin spyOn):
     * - localStorage['usuario'] existe y es JSON válido
     * - alerta contiene "Bienvenid@" + nombre
     * - router.url cambia a /admin
     */

  
    component.loginCorreo = 'admin@tierraencalma.com';
    component.loginContrasena = 'admin123';

    // Captura controlada de alert SIN spyOn
    const originalAlert = window.alert;
    let alertCapturado = '';
    window.alert = (msg: any) => { alertCapturado = String(msg); };

    // Evento submit realista
    const fakeEvent = { preventDefault: () => {} } as unknown as Event;

    // Ejecutamos el método real (dispara HTTP real por AuthService)
    component.onLoginSubmit(fakeEvent);
    fixture.detectChanges();

    /**
     * Como la respuesta llega async (HTTP real), esperamos un tiempo corto y validamos.
     * Si tu backend tarda más, puedes aumentar el timeout o este setTimeout.
     */
    setTimeout(() => {
      try {
        // Debe existir usuario en localStorage
        const raw = localStorage.getItem('usuario');
        expect(raw).not.toBeNull();

        // Debe ser JSON válido
        const usuario = raw ? JSON.parse(raw) : null;
        expect(usuario).toBeTruthy();

        // Debe haber mostrado bienvenida si el usuario trae NOMBRE o nombre

        expect(alertCapturado.startsWith('Bienvenid@ ')).toBeTrue();

        // Debe navegar a /admin
        expect(router.url).toBe('/admin');

      } finally {
        // Restaurar alert para no afectar otras pruebas
        window.alert = originalAlert;
        done();
      }
    }, 800);
  });
});