import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('HU23 - Registro de cuidados - Escenario 6', () => {
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
                get: () => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MonsteraComponent);
    component = fixture.componentInstance;
  });

  it('Escenario 6 — Flujo exitoso limpia formulario', async () => {
    // Arrange
    const alertSpy = spyOn(globalThis, 'alert');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: 'Riego',
      detalles: 'Aplicado'
    };

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => ''
      } as Response)
    );

    // Act
    component.guardarCuidado();
    await flushPromises();

    // Assert
    expect(alertSpy).toHaveBeenCalled();
    expect(component.nuevoCuidado).toEqual({
      fecha: '',
      tipo_cuidado: '',
      detalles: ''
    });
  });
});