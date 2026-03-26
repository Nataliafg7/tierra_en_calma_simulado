/**
 * HU1F - Registro de usuario (Frontend Angular)
 * Escenario P1: Campos obligatorios vacíos
 *
 * Objetivo de la prueba:
 * Verificar que el método onRegisterSubmit() detenga el flujo cuando
 * faltan campos obligatorios, evitando la petición HTTP y mostrando el mensaje correspondiente.
 *
 * Principios FIRST:
 * - Fast: no depende de backend real.
 * - Independent: no depende de otras pruebas.
 * - Repeatable: siempre produce el mismo resultado.
 * - Self-validating: valida con expect().
 * - Timely: prueba directamente una unidad concreta del componente.
 *
 * Patrón AAA:
 * - Arrange: preparar datos vacíos y evento.
 * - Act: ejecutar onRegisterSubmit().
 * - Assert: comprobar preventDefault, alerta y ausencia de request.
 *
 * Tipo de double usado:
 * - Spy: sobre window.alert para verificar el mensaje mostrado.
 * - Stub de infraestructura HTTP: HttpTestingController para comprobar
 *   que no se emite ninguna solicitud al backend.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

describe('HU1F - Registro Frontend (P1)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
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
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('HU1F_P1 - No debe registrar si faltan campos obligatorios', () => {
    // ===================== ARRANGE =====================
    component.regIdUsuario = '   ';
    component.regNombre = '   ';
    component.regApellido = '';
    component.regTelefono = '';
    component.regCorreo = '   ';
    component.regContrasena = '   ';

    const alertSpy = spyOn(window, 'alert');

    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    component.onRegisterSubmit(event);

    // ===================== ASSERT ======================
    expect(preventDefaultEjecutado).toBeTrue();
    expect(alertSpy).toHaveBeenCalledWith('Todos los campos son obligatorios.');

    const requests = httpMock.match(() => true);
    expect(requests.length).toBe(0);
  });
});