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
      imports: [
        LoginComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
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
    // FIRST: prueba rápida, independiente y repetible porque no usa backend real.

    // ===================== ARRANGE =====================
    // Se preparan campos vacíos para validar el comportamiento del formulario.
    component.regIdUsuario = '   ';
    component.regNombre = '   ';
    component.regApellido = '';
    component.regTelefono = '';
    component.regCorreo = '   ';
    component.regContrasena = '   ';

    // Se usa un spy para comprobar el mensaje mostrado al usuario.
    const alertSpy = spyOn(window, 'alert');

    // Se simula el evento del formulario para validar que se detiene el envío.
    let preventDefaultEjecutado = false;

    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as Event;

    // ======================= ACT =======================
    // Se ejecuta el método que procesa el registro.
    component.onRegisterSubmit(event);

    // ===================== ASSERT ======================
    // Fluent Assertion: las validaciones se expresan de forma encadenada con expect().toBe().
    expect(preventDefaultEjecutado).toBe(true);

    // Fluent Assertion: se valida que la alerta indique que faltan campos obligatorios.
    expect(alertSpy).toHaveBeenCalledWith('Todos los campos son obligatorios.');

    // Fluent Assertion: se confirma que no se haya enviado ninguna solicitud HTTP.
    const requests = httpMock.match(() => true);
    expect(requests.length).toBe(0);
  });
});