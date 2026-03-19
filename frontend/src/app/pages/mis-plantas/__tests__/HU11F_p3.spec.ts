/**
 * HU11 – Frontend – Escenario 3 (P3)
 * Error en la consulta de plantas (bloque error del subscribe)
 *
 * Código analizado (ngOnInit):
 * this.authService.getMisPlantas(id).subscribe({
 *   next: (...) => {...},
 *   error: () => { alert('No fue posible cargar tus plantas.'); }
 * });
 *
 * Justificación del mock en este escenario:
 * - Este escenario requiere forzar de manera CONTROLADA el camino "error" del observable.
 * - Sin mock, dependeríamos de fallas externas (backend caído, red, CORS), lo cual no es
 *   reproducible ni consistente.
 * - El objetivo aquí es validar la lógica del componente ante un error del servicio,
 *   no validar disponibilidad del backend.
 */

import { TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { throwError } from 'rxjs';

import { MisPlantasComponent } from '../mis-plantas';
import { AuthService } from '../../login/auth.service';
describe('HU11 Front – Escenario 3 (P3) – Error al consultar plantas', () => {

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

  it('P3: Debe ejecutar el bloque error y mostrar alerta cuando getMisPlantas falla', waitForAsync(async () => {

    // Precondición: sesión válida (id entero)
    localStorage.setItem('usuario', JSON.stringify({
      id: 1000410154,
      nombre: 'Juliana'
    }));

    // Obtener el servicio real del DI para poder forzar el error en el observable
    const authService = TestBed.inject(AuthService);

    // Forzamos el escenario P3: el servicio devuelve un observable que falla
    // (mock/spy controlado y justificado)
    spyOn(authService, 'getMisPlantas').and.returnValue(
      throwError(() => new Error('Falla simulada en getMisPlantas'))
    );

    // Para verificar que realmente se mostró el mensaje, aquí SÍ usamos spy sobre alert.
    // Esto se considera parte del entorno, no una dependencia de negocio.
    const alertSpy = spyOn(window, 'alert');

    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges(); // dispara ngOnInit()

    // Esperar a que el subscribe maneje el error
    await fixture.whenStable();

    // Validación principal del escenario: se notifica el error al usuario
    expect(alertSpy).toHaveBeenCalledWith('No fue posible cargar tus plantas.');

    // Validación adicional: como falló, el flujo de éxito NO debe setear page=1 por este camino
    // (Si tu page inicia en 1 por defecto, esta aserción no sirve. Si inicia distinto, sí.)
    // Por eso aquí no forzamos una expectativa rígida adicional.
    expect(Array.isArray((component as any).plantas)).toBeTrue();
    // Si en tu código no asignas plantas en error, normalmente queda como valor inicial.
  }));

});