import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';

describe('HU23 - Registro de cuidados - Escenario 4', () => {
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

  it('Escenario 4 — Si el tipo de cuidado está vacío o tiene solo espacios, muestra error de tipo', () => {
    // Arrange
    const alertSpy = spyOn(globalThis, 'alert');
    const warnSpy = spyOn(console, 'warn');
    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: '   ',
      detalles: 'Detalle cualquiera'
    };

    // Act
    component.guardarCuidado();

    // Assert
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Falta tipo de cuidado');
    expect(warnSpy).toHaveBeenCalled();
    expect(component.nuevoCuidado.fecha).toBe('2026-03-04');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('   ');
    expect(component.nuevoCuidado.detalles).toBe('Detalle cualquiera');
  });
});