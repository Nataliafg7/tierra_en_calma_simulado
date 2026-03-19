/**
 * HU11 – Frontend – Escenario 1 (P1)
 * Sesión inválida en el método ngOnInit()
 *
 * Este conjunto de pruebas valida el comportamiento del componente
 * MisPlantasComponent cuando el identificador del usuario almacenado
 * en localStorage no es válido.
 *
 * El código analizado corresponde al método ngOnInit() del componente
 * mis-plantas.ts, específicamente al bloque:
 *
 * if (!Number.isInteger(id)) {
 *   alert('Sesión inválida. Inicia sesión nuevamente.');
 *   this.router.navigate(['/login']);
 *   return;
 * }
 *
 * Se verifica que el sistema redirija al usuario al login y que el
 * flujo se detenga sin intentar cargar las plantas.
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { MisPlantasComponent } from '../mis-plantas';
import { LoginComponent } from '../../login/login';

describe('HU11 Front – Escenario 1 (P1) – Sesión inválida', () => {

  let location: Location;

  /**
   * Configuración del entorno de pruebas.
   *
   * Se inicializa el TestBed con:
   * - HttpClientModule para permitir dependencias reales del componente
   * - RouterTestingModule para simular navegación entre rutas
   * - MisPlantasComponent como componente bajo prueba
   */
  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [
        HttpClientModule,

        RouterTestingModule.withRoutes([
          { path: 'login', component: LoginComponent },
          { path: 'mis-plantas', component: MisPlantasComponent }
        ]),

        MisPlantasComponent
      ]

    }).compileComponents();

    location = TestBed.inject(Location);
  });

  /**
   * Limpieza después de cada prueba.
   * Se elimina la variable usuario del localStorage
   * para evitar interferencias entre escenarios.
   */
  afterEach(() => {
    localStorage.removeItem('usuario');
  });


  /**
   * ESCENARIO P1-A
   *
   * Condición:
   * No existe el objeto "usuario" en localStorage.
   *
   * Flujo esperado:
   * 1. safeParse(localStorage.getItem('usuario')) devuelve null
   * 2. id se evalúa como undefined
   * 3. Number.isInteger(undefined) retorna false
   * 4. Se ejecuta la alerta de sesión inválida
   * 5. Se redirige al usuario a la ruta /login
   * 6. El método termina con return
   */
  it('P1-A: Debe redirigir a /login cuando no existe usuario en localStorage', fakeAsync(() => {

    // Precondición: eliminar usuario del almacenamiento local
    localStorage.removeItem('usuario');

    // Crear instancia del componente
    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    // Guardar estado inicial para verificar que no se modifica
    const pageInicial = (component as any).page;
    const plantasInicial = (component as any).plantas;

    // Ejecutar ngOnInit()
    fixture.detectChanges();

    // Permitir que la navegación asíncrona ocurra
    tick();

    // Verificar redirección al login
    expect(location.path()).toBe('/login');

    // Verificar que el flujo de carga de plantas no se ejecutó
    expect((component as any).page).toBe(pageInicial);
    expect((component as any).plantas).toBe(plantasInicial);

  }));


  /**
   * ESCENARIO P1-B
   *
   * Condición:
   * El objeto usuario existe pero el id viene como STRING.
   *
   * Ejemplo:
   * { id: "1", nombre: "Juliana" }
   *
   * Flujo esperado:
   * Number.isInteger("1") devuelve false,
   * por lo tanto el sistema considera la sesión inválida.
   */
  it('P1-B: Debe redirigir a /login cuando el id viene como string', fakeAsync(() => {

    // Simular usuario con id en formato string
    localStorage.setItem('usuario', JSON.stringify({
      id: "1",
      nombre: "Juliana"
    }));

    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    const pageInicial = (component as any).page;

    fixture.detectChanges();
    tick();

    // Verificar redirección
    expect(location.path()).toBe('/login');

    // Confirmar que el flujo de carga no avanzó
    expect((component as any).page).toBe(pageInicial);

  }));


  /**
   * ESCENARIO P1-C
   *
   * Condición:
   * El id del usuario es decimal.
   *
   * Ejemplo:
   * { id: 1.2 }
   *
   * Number.isInteger(1.2) retorna false,
   * por lo que el sistema invalida la sesión.
   */
  it('P1-C: Debe redirigir a /login cuando el id es decimal', fakeAsync(() => {

    localStorage.setItem('usuario', JSON.stringify({
      id: 1.2,
      nombre: "Juliana"
    }));

    const fixture = TestBed.createComponent(MisPlantasComponent);

    fixture.detectChanges();
    tick();

    expect(location.path()).toBe('/login');

  }));

});