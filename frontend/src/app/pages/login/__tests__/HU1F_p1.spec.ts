/**
 * HU1F - Registro de usuario (Frontend Angular)
 * Escenario P1: Campos obligatorios vacíos
 *
 * ¿Qué se está probando?
 * Este test valida el comportamiento del método onRegisterSubmit() cuando el usuario
 * intenta registrarse SIN completar los campos mínimos (id_usuario, nombre, correo y contraseña).
 *
 * Comportamiento esperado (según el código del componente):
 * 1) Se llama event.preventDefault() para evitar el envío normal del formulario.
 * 2) Se construye el objeto newUser haciendo trim() a los inputs.
 * 3) El if de campos obligatorios se cumple (porque vienen vacíos).
 * 4) Se muestra un alert y el método termina con return.
 * 5) Al terminar con return, NO se debe ejecutar authService.register(...)
 *    y por lo tanto NO debe salir ninguna petición HTTP.
 * */

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
    /**
     * 1) Configuración del entorno de pruebas:
     * - LoginComponent es standalone, por eso se agrega en imports.
     * - HttpClientTestingModule permite interceptar requests HTTP.
     * - RouterTestingModule y ActivatedRoute se incluyen para que el constructor del componente
     *   pueda inyectar Router/ActivatedRoute sin fallar.
     */
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

    /**
     * 2) Se crea el componente real tal cual lo haría Angular.
     *    NO se llama detectChanges() porque no necesitamos ejecutar ngOnInit para esta prueba.
     */
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    /**
     * 3) Se obtiene el controlador de HTTP para poder validar si salieron requests.
     */
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    /**
     * 4) Verificación final:
     * Si quedó alguna petición HTTP sin controlar, el test debe fallar.
     * En P1 lo esperado es que no exista ninguna.
     */
    httpMock.verify();
  });

  it('HU1F_P1 - No debe registrar si faltan campos obligatorios (0 requests HTTP)', () => {
    /**
     * 1) Preparamos inputs vacíos para forzar el escenario P1.
     *    Con esto el if de obligatorios debe cumplirse y el método debe hacer return.
     */
    component.regIdUsuario = '';
    component.regNombre = '';
    component.regApellido = '';
    component.regTelefono = '';
    component.regCorreo = '';
    component.regContrasena = '';

    /**
     * 2) Evento de submit sin spy:
     *    Para verificar que preventDefault() se ejecutó, usamos una bandera booleana.
     */
    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => {
        preventDefaultEjecutado = true;
      }
    } as unknown as Event;

    /**
     * 3) Ejecutamos el método real del componente.
     */
    component.onRegisterSubmit(event);

    /**
     * 4) Assertions:
     * - Debe haber ejecutado preventDefault()
     */
    expect(preventDefaultEjecutado).toBeTrue();

    /**
     * 5) Assertion principal del escenario:
     * Como el método hace return antes de authService.register(...),
     * NO debe existir ninguna request HTTP.
     */
    const requests = httpMock.match(() => true);
    expect(requests.length).toBe(0);
  });
});