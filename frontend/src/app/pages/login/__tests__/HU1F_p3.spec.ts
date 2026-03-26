/**
 * HU1F - Registro de usuario (Frontend Angular)
 * Escenario P3: Error del backend al registrar
 *
 * Objetivo de la prueba:
 * Verificar que onRegisterSubmit() maneje correctamente la rama error
 * cuando el backend falla, mostrando el mensaje de error y manteniendo
 * al usuario en la vista de registro.
 *
 * Principios FIRST:
 * - Fast: no depende del backend real.
 * - Independent: no depende de base de datos ni de otras pruebas.
 * - Repeatable: siempre se ejecuta en condiciones controladas.
 * - Self-validating: usa expect() para validar el resultado.
 * - Timely: se enfoca en una sola rama del método.
 *
 * Patrón AAA:
 * - Arrange: preparar datos válidos, vista de registro y evento.
 * - Act: ejecutar onRegisterSubmit() y simular error HTTP.
 * - Assert: comprobar alerta, request enviada y permanencia en registro.
 *
 * Tipo de double usado:
 * - Spy: sobre window.alert para verificar el mensaje mostrado.
 * - Stub de infraestructura HTTP: HttpTestingController para simular
 *   el error del backend sin hacer llamadas reales.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

describe('HU1F - Registro Frontend (P3)', () => {
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

  it('HU1F_P3 - Debe mostrar error y mantenerse en registro cuando falla el backend', () => {
    // ===================== ARRANGE =====================
    component.isContainerActive = true;
    component.isTransitioning = false;

    component.regIdUsuario = '12345';
    component.regNombre = 'Juliana';
    component.regApellido = 'Casas';
    component.regTelefono = '3000000000';
    component.regCorreo = 'juliana@mail.com';
    component.regContrasena = '1234';

    const alertSpy = spyOn(window, 'alert');

    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    component.onRegisterSubmit(event);

    const req = httpMock.expectOne(r =>
      r.method === 'POST' && r.url.endsWith('/register')
    );

    req.flush(
      { message: 'Error interno' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    // ===================== ASSERT ======================
    expect(preventDefaultEjecutado).toBeTrue();
    expect(req.request.method).toBe('POST');

    expect(req.request.body).toEqual({
      id_usuario: '12345',
      nombre: 'Juliana',
      apellido: 'Casas',
      telefono: '3000000000',
      correo_electronico: 'juliana@mail.com',
      contrasena: '1234'
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'No se pudo registrar el usuario. Revisa los datos o intenta más tarde.'
    );

    expect(component.isContainerActive).toBeTrue();
    expect(component.isTransitioning).toBeFalse();
  });
});