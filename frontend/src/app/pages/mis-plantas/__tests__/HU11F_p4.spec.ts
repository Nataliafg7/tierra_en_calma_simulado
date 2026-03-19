/**
 * HU11 – Frontend – Escenario 4 (P4)
 * Respuesta exitosa pero con formato inválido (rows NO es arreglo)
 *
 * Camino esperado:
 * - id válido → se llama getMisPlantas(id)
 * - se ejecuta next(rows)
 * - rows NO es Array → this.plantas = []
 * - resetCarrusel() se ejecuta
 * - page = 1
 *
 * Justificación del mock:
 * - Es un escenario de robustez: simula un contrato roto del backend.
 * - Provocarlo con backend real no es confiable ni repetible.
 * - Se valida la lógica defensiva del componente (Array.isArray).
 */

import { TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';

import { MisPlantasComponent } from '../mis-plantas';
import { AuthService } from '../../login/auth.service';

describe('HU11 Front – Escenario 4 (P4) – Respuesta no válida (no array)', () => {

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

  it('P4: Debe asignar [] cuando el servicio retorna un objeto en vez de arreglo', waitForAsync(async () => {

    // Precondición: sesión válida
    localStorage.setItem('usuario', JSON.stringify({
      id: 1000410154,
      nombre: 'Juliana'
    }));

    const authService = TestBed.inject(AuthService);

    // Forzar next con un valor NO arreglo (objeto)
    spyOn(authService, 'getMisPlantas').and.returnValue(
      of({ mensaje: 'respuesta inválida' } as any)
    );

    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges(); // ngOnInit()
    await fixture.whenStable();
    fixture.detectChanges();

    // Validación clave P4
    expect(Array.isArray((component as any).plantas)).toBeTrue();
    expect(((component as any).plantas).length).toBe(0);

    // Flujo de éxito debe reiniciar page
    expect((component as any).page).toBe(1);
  }));

});