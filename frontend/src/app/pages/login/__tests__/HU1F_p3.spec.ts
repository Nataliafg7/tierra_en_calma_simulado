/// <reference types="jasmine" />

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

describe('HU1F - Registro Frontend', () => {
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
    // FIRST: prueba rápida, independiente y repetible porque simula el error sin usar backend real.

    // ===================== ARRANGE =====================
    // Se prepara el componente en la vista de registro.
    component.isContainerActive = true;
    component.isTransitioning = false;

    // Se ingresan datos válidos para que el flujo llegue hasta la petición HTTP.
    component.regIdUsuario = '12345';
    component.regNombre = 'Juliana';
    component.regApellido = 'Casas';
    component.regTelefono = '3000000000';
    component.regCorreo = 'juliana@mail.com';
    component.regContrasena = '12345678';

    // Se usa un spy para validar el mensaje mostrado ante el error.
    const alertSpy = spyOn(window, 'alert');

    // Se simula el evento del formulario para verificar que se detiene el envío tradicional.
    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    // Se ejecuta el método que procesa el registro.
    component.onRegisterSubmit(event);

    // Se intercepta la petición HTTP que normalmente iría al backend.
    const req = httpMock.expectOne(request =>
      request.method === 'POST' && request.url.endsWith('/register')
    );

    // Se simula una respuesta de error del backend.
    req.flush(
      { message: 'Error interno' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    // ===================== ASSERT ======================
    // Se valida que el formulario haya detenido su comportamiento por defecto.
    expect(preventDefaultEjecutado)
      .withContext('Debe ejecutar preventDefault antes de procesar el registro')
      .toBeTrue();

    // Se valida que la petición enviada sea de tipo POST.
    expect(req.request.method)
      .withContext('Debe enviar una petición POST para intentar registrar el usuario')
      .toBe('POST');

    // Se valida que el cuerpo enviado al backend contenga los datos correctos.
    expect(req.request.body)
      .withContext('Debe enviar el objeto newUser con la información del formulario')
      .toEqual({
        id_usuario: '12345',
        nombre: 'Juliana',
        apellido: 'Casas',
        telefono: '3000000000',
        correo_electronico: 'juliana@mail.com',
        contrasena: '12345678'
      });

    // Se valida que el usuario reciba un mensaje claro cuando falla el registro.
    expect(alertSpy)
      .withContext('Debe mostrar una alerta indicando que no se pudo registrar el usuario')
      .toHaveBeenCalledWith(
        'No se pudo registrar el usuario. Revisa los datos o intenta más tarde.'
      );

    // Se valida que el usuario permanezca en la vista de registro.
    expect(component.isContainerActive)
      .withContext('Debe mantenerse en la vista de registro cuando el backend falla')
      .toBeTrue();

    // Se valida que no se active la transición hacia login.
    expect(component.isTransitioning)
      .withContext('No debe iniciar transición si el registro no fue exitoso')
      .toBeFalse();
  });
});