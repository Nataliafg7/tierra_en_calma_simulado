/**
 * PRUEBAS DE RENDIMIENTO - FRONTEND
 *
 * Historias evaluadas:
 * HU1  - Registro de usuario
 * HU3  - Inicio de sesión
 * HU8  - Consulta del banco de especies
 * HU10 - Asociación de plantas
 * HU11 - Visualización de plantas registradas
 *
 * Objetivo:
 * Verificar que los componentes principales de la interfaz
 * se creen y carguen en un tiempo adecuado dentro del navegador de pruebas.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { LoginComponent } from '../login';
import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';
import { MisPlantasComponent } from '../../mis-plantas/mis-plantas';

describe('Rendimiento frontend - HU1, HU3, HU8, HU10 y HU11', () => {
  let httpMock: HttpTestingController;

  /**
   * Configuración general:
   * Se cargan los componentes standalone y se reemplazan
   * las peticiones reales por peticiones controladas.
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

    httpMock = TestBed.inject(HttpTestingController);
  });

  /**
   * Limpieza:
   * Verifica que no queden solicitudes HTTP pendientes.
   */
  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('HU1 y HU3 - carga el componente de login y registro en tiempo adecuado', () => {
    /**
     * Inicio de medición del tiempo.
     */
    const inicio = performance.now();

    /**
     * Se crea el componente que contiene login y registro.
     */
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    /**
     * Fin de medición del tiempo.
     */
    const tiempo = performance.now() - inicio;

    /**
     * Se valida que el componente exista y cargue antes de 1000 ms.
     */
    expect(component).toBeTruthy();
    expect(tiempo).toBeLessThan(1000);
  });

  it('HU8 y HU10 - carga el componente de registrar plantas en tiempo adecuado', () => {
    /**
     * Inicio de medición.
     */
    const inicio = performance.now();

    /**
     * Se crea el componente encargado del banco de especies
     * y la asociación de plantas.
     */
    const fixture = TestBed.createComponent(RegistrarPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    /**
     * Se responde la petición inicial de carga de plantas.
     */
    const req = httpMock.expectOne('http://localhost:3000/api/plantas');
    req.flush([]);

    /**
     * Fin de medición.
     */
    const tiempo = performance.now() - inicio;

    /**
     * Se valida que cargue correctamente dentro del límite definido.
     */
    expect(component).toBeTruthy();
    expect(tiempo).toBeLessThan(1000);
  });

  it('HU11 - carga el componente de mis plantas en tiempo adecuado', () => {
    /**
     * Se simula una sesión válida en localStorage.
     */
    localStorage.setItem('usuario', JSON.stringify({
      ID_USUARIO: 1,
      NOMBRE: 'Juliana'
    }));

    /**
     * Inicio de medición.
     */
    const inicio = performance.now();

    /**
     * Se crea el componente de plantas registradas.
     */
    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    /**
     * La carga de plantas se realiza mediante AuthService.
     * Se responde la solicitud HTTP esperada.
     */
    const req = httpMock.expectOne('http://localhost:3000/api/mis-plantas');
    req.flush([]);

    /**
     * Fin de medición.
     */
    const tiempo = performance.now() - inicio;

    /**
     * Se valida que la vista cargue en tiempo adecuado.
     */
    expect(component).toBeTruthy();
    expect(tiempo).toBeLessThan(1000);
  });
});