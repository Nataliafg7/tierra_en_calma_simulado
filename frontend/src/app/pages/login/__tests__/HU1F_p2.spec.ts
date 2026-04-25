/// <reference types="jasmine" />

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
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

  it('HU1F_P2 - Debe registrar correctamente y volver a la vista de login', fakeAsync(() => {
    // FIRST: prueba rápida, independiente y repetible porque usa datos controlados y HTTP simulado.

    // ===================== ARRANGE =====================
    // Se prepara el componente en la vista de registro.
    component.isContainerActive = true;
    component.isTransitioning = false;

    // Se ingresan datos válidos con espacios para validar que el método los normalice antes de enviarlos.
    component.regIdUsuario = ' 12345 ';
    component.regNombre = ' Juliana ';
    component.regApellido = ' Casas ';
    component.regTelefono = ' 3000000000 ';
    component.regCorreo = ' juliana@mail.com ';
    component.regContrasena = ' 12345678 ';

    // Se usa un spy para comprobar el mensaje mostrado después del registro exitoso.
    const alertSpy = spyOn(window, 'alert');

    // Se simula el evento del formulario para validar que se detiene el envío tradicional.
    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    // ======================= ACT =======================
    // Se ejecuta el método que procesa el registro.
    component.onRegisterSubmit(event);

    // Se intercepta la petición HTTP sin usar el backend real.
    const req = httpMock.expectOne(request =>
      request.method === 'POST' && request.url.endsWith('/register')
    );

    // Se simula una respuesta exitosa del backend.
    req.flush({ message: 'Usuario registrado con éxito.' });

    // ===================== ASSERT ======================
    // Se valida que el formulario haya detenido su comportamiento por defecto.
    expect(preventDefaultEjecutado)
      .withContext('Debe ejecutar preventDefault antes de procesar el registro')
      .toBeTrue();

    // Se valida que la petición enviada sea de tipo POST.
    expect(req.request.method)
      .withContext('Debe enviar una petición POST para registrar el usuario')
      .toBe('POST');

    // Se valida que el cuerpo enviado al backend tenga los datos limpios y correctos.
    expect(req.request.body)
      .withContext('Debe construir el objeto newUser con datos normalizados')
      .toEqual({
        id_usuario: '12345',
        nombre: 'Juliana',
        apellido: 'Casas',
        telefono: '3000000000',
        correo_electronico: 'juliana@mail.com',
        contrasena: '12345678'
      });

    // Se valida que el usuario reciba confirmación visual del registro exitoso.
    expect(alertSpy)
      .withContext('Debe mostrar el mensaje de registro exitoso')
      .toHaveBeenCalledWith('Usuario registrado con éxito.');

    // Se valida que inicie la transición hacia la vista de login.
    expect(component.isTransitioning)
      .withContext('Debe iniciar la transición después de registrar correctamente')
      .toBeTrue();

    // Se avanza el tiempo simulado para completar la transición configurada en el componente.
    tick(150);

    // Se valida que el componente vuelva a la vista de login.
    expect(component.isContainerActive)
      .withContext('Debe volver a la vista de login después de la transición')
      .toBeFalse();

    expect(component.isTransitioning)
      .withContext('Debe finalizar la transición después del tiempo definido')
      .toBeFalse();
  }));
});