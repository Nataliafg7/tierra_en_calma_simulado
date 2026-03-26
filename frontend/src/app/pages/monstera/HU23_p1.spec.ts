import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';

describe('HU23 - Registro de cuidados - Escenario 1', () => {
  let component: MonsteraComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsteraComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null // dummy
              }
            }
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    component = fixture.componentInstance;
  });

  it('Escenario 1 — Si el id no es entero y localStorage también es inválido, muestra error de ID y no hace POST', () => {
    // Arrange
    const alertSpy = spyOn(globalThis, 'alert');
    const warnSpy = spyOn(console, 'warn');
    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = null;
    localStorage.setItem('planta_usuario_id', 'abc');

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: 'Riego',
      detalles: 'Prueba de cuidado'
    };

    // Act
    component.guardarCuidado();

    // Assert
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Falta id_planta_usuario');
    expect(warnSpy).toHaveBeenCalled();
    expect(component.nuevoCuidado.fecha).toBe('2026-03-04');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('Riego');
    expect(component.nuevoCuidado.detalles).toBe('Prueba de cuidado');
  });
});