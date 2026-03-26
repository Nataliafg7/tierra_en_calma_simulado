import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('HU23 - Registro de cuidados - Escenario 5', () => {
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

  it('Escenario 5 — Si el backend responde con error, se ejecuta catch', async () => {
    // Arrange
    const alertSpy = spyOn(globalThis, 'alert');
    const errorSpy = spyOn(console, 'error');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '2026-03-04',
      tipo_cuidado: 'Poda',
      detalles: 'Detalle'
    };

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: false,
        text: async () => 'Error backend',
        json: async () => ({})
      } as Response)
    );

    // Act
    component.guardarCuidado();
    await flushPromises();

    // Assert
    expect(errorSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Error guardando el cuidado');
  });
});