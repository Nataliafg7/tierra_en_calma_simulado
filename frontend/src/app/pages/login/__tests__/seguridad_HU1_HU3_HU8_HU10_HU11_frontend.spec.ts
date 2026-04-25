/**
 * PRUEBAS DE SEGURIDAD - FRONTEND
 *
 * Historias evaluadas:
 * HU1  - Registro de usuario
 * HU3  - Inicio de sesión
 * HU8  - Consulta del banco de especies
 * HU10 - Asociación de plantas
 * HU11 - Visualización de plantas registradas
 *
 * Objetivo:
 * Validar que la interfaz controle entradas inválidas,
 * gestione correctamente errores y restrinja acciones sin sesión.
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { LoginComponent } from '../login';
import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';
import { MisPlantasComponent } from '../../mis-plantas/mis-plantas';

describe('Seguridad frontend - HU1, HU3, HU8, HU10 y HU11', () => {
  let router: Router;
  let httpMock: HttpTestingController;

  /**
   * Configuración inicial del entorno de pruebas:
   * - Se cargan los componentes standalone
   * - Se inyecta el router para controlar navegación
   * - Se inyecta HttpTestingController para simular respuestas HTTP
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        RegistrarPlantasComponent,
        MisPlantasComponent
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);

    /**
     * Se intercepta la navegación para verificar redirecciones
     */
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  /**
   * Limpieza posterior a cada prueba:
   * - Se verifica que no queden peticiones HTTP pendientes
   * - Se limpia localStorage para evitar interferencias entre pruebas
   */
  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('HU1 - no permite registro con campos obligatorios vacíos', () => {
    /**
     * Se crea el componente de login (contiene el registro)
     */
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance as any;

    spyOn(window, 'alert');

    /**
     * Se simulan campos vacíos en el formulario de registro
     */
    component.regIdUsuario = '';
    component.regNombre = '';
    component.regCorreo = '';
    component.regContrasena = '';

    /**
     * Se ejecuta el envío del formulario
     */
    component.onRegisterSubmit(new Event('submit'));

    /**
     * Se valida que el sistema bloquee la acción y muestre alerta
     */
    expect(window.alert).toHaveBeenCalledWith('Todos los campos son obligatorios.');
  });

  it('HU3 - no permite login sin correo y contraseña', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance as any;

    spyOn(window, 'alert');

    /**
     * Se simulan credenciales vacías
     */
    component.loginCorreo = '';
    component.loginContrasena = '';

    component.onLoginSubmit(new Event('submit'));

    /**
     * Se valida que el sistema impida el login
     */
    expect(window.alert).toHaveBeenCalledWith('Ingresa tu correo y contraseña.');
  });

  it('HU8 - maneja error cuando falla la carga de plantas', () => {
    const fixture = TestBed.createComponent(RegistrarPlantasComponent);
    const component = fixture.componentInstance as any;

    spyOn(window, 'alert');

    /**
     * Se ejecuta la carga de plantas
     */
    component.cargarPlantas();

    /**
     * Se simula un error del servidor
     */
    const req = httpMock.expectOne('http://localhost:3000/api/plantas');
    req.flush({}, { status: 500, statusText: 'Error del servidor' });

    /**
     * Se valida que el sistema informe el error al usuario
     */
    expect(window.alert).toHaveBeenCalledWith('No se pudieron cargar las plantas desde el servidor');
  });

  it('HU10 - no permite añadir planta sin usuario en sesión', () => {
    const fixture = TestBed.createComponent(RegistrarPlantasComponent);
    const component = fixture.componentInstance as any;

    spyOn(window, 'alert');

    /**
     * Se define una planta válida pero sin sesión activa
     */
    component.plantaIds = { lavanda: 1 };

    localStorage.removeItem('usuario');

    component.anadirPlanta('lavanda');

    /**
     * Se valida que se bloquee la acción y se redirija al login
     */
    expect(window.alert).toHaveBeenCalledWith('Debes iniciar sesión antes de añadir plantas');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('HU10 - no permite añadir planta sin id válido', () => {
    const fixture = TestBed.createComponent(RegistrarPlantasComponent);
    const component = fixture.componentInstance as any;

    spyOn(window, 'alert');

    /**
     * Se simula usuario autenticado pero sin planta válida
     */
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1 }));

    component.plantaIds = {};

    component.anadirPlanta('lavanda');

    /**
     * Se valida que el sistema detecte el error
     */
    expect(window.alert).toHaveBeenCalledWith('No se encontró el ID de la planta seleccionada');
  });

  it('HU11 - redirige cuando no existe sesión válida', () => {
    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance as any;

    spyOn(window, 'alert');

    /**
     * Se elimina cualquier sesión almacenada
     */
    localStorage.removeItem('usuario');

    component.ngOnInit();

    /**
     * Se valida que el sistema bloquee el acceso y redirija
     */
    expect(window.alert).toHaveBeenCalledWith('Sesión inválida. Inicia sesión nuevamente.');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});