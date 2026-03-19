/**
 * HU11 – Frontend – Escenario 2 (P2)
 * Flujo exitoso de carga de plantas
 *

 */

import { TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { MisPlantasComponent } from '../mis-plantas';

describe('HU11 Front – Escenario 2 (P2) – Consulta exitosa de plantas', () => {

  beforeEach(waitForAsync(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        MisPlantasComponent
      ]
    }).compileComponents();
  }));

  afterEach(() => {
    localStorage.removeItem('usuario');
  });

  /**
   * P2-A — Usuario con plantas
   * Usuario real: 1000410154
   *
   * Resultado esperado:
   * - plantas es arreglo
   * - plantas.length > 0
   * - page = 1
   */
  it('P2-A: Debe cargar plantas cuando el usuario tiene registros', waitForAsync(async () => {

    localStorage.setItem('usuario', JSON.stringify({
      id: 1000410154,
      nombre: 'Juliana'
    }));

    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges(); // dispara ngOnInit()

    // Espera a que Angular termine las tareas async pendientes (incluye XHR real)
    await fixture.whenStable();

    fixture.detectChanges();

    expect(Array.isArray((component as any).plantas)).toBeTrue();
    expect(((component as any).plantas).length).toBeGreaterThan(0);
    expect((component as any).page).toBe(1);
  }));


  /**
   * P2-B — Usuario sin plantas
   * Usuario real: 42900093
   *
   * Resultado esperado:
   * - plantas es arreglo
   * - plantas.length = 0
   * - page = 1
   */
  it('P2-B: Debe manejar correctamente respuesta vacía []', waitForAsync(async () => {

    localStorage.setItem('usuario', JSON.stringify({
      id: 42900093,
      nombre: 'Juliana'
    }));

    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    await fixture.whenStable();

    fixture.detectChanges();

    expect(Array.isArray((component as any).plantas)).toBeTrue();
    expect(((component as any).plantas).length).toBe(0);
    expect((component as any).page).toBe(1);
  }));

});