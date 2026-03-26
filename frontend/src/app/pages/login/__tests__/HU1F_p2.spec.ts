/**
 * HU1F - Registro de usuario (Frontend Angular)
 * Escenario P2: Registro exitoso
 *
 * Objetivo de la prueba:
 * Verificar que onRegisterSubmit() construya correctamente el objeto newUser,
 * envíe la petición POST al backend, procese la respuesta exitosa y ejecute
 * la transición hacia la vista de login mediante showLogin().
 *
 * Principios FIRST:
 * - Fast: usa infraestructura HTTP simulada.
 * - Independent: no depende de backend real ni de otras pruebas.
 * - Repeatable: usa datos controlados.
 * - Self-validating: se comprueba todo con expect().
 * - Timely: prueba el flujo exitoso exacto del método.
 *
 * Patrón AAA:
 * - Arrange: preparar estado del componente, datos y evento.
 * - Act: ejecutar onRegisterSubmit() y simular respuesta exitosa.
 * - Assert: validar request, body y cambio de estado.
 *
 * Tipo de double usado:
 * - Stub de infraestructura HTTP: HttpTestingController para interceptar
 *   la solicitud POST y responderla sin usar el backend real.
 */

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

describe('HU1F - Registro Frontend (P2)', () => {
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

  it('HU1F_P2 - Debe registrar correctamente y volver a la vista de login', fakeAsync(() => {
    // ===================== ARRANGE =====================
    component.isContainerActive = true;
    component.isTransitioning = false;

    component.regIdUsuario = ' 12345 ';
    component.regNombre = ' Juliana ';
    component.regApellido = ' Casas ';
    component.regTelefono = ' 3000000000 ';
    component.regCorreo = ' juliana@mail.com ';
    component.regContrasena = ' 1234 ';

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

    req.flush({ message: 'Usuario registrado con éxito.' });

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

    expect(alertSpy).toHaveBeenCalledWith('Usuario registrado con éxito.');

    expect(component.isTransitioning).toBeTrue();

    tick(150);

    expect(component.isContainerActive).toBeFalse();
    expect(component.isTransitioning).toBeFalse();
  }));
});