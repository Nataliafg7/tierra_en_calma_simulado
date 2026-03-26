import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { MonsteraComponent } from './monstera';

describe('HU23 - Registro de cuidados - Escenario 3', () => {
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

  it('Escenario 3 — Si la fecha es inválida, muestra error de fecha y no hace POST', () => {
    // Arrange
    const alertSpy = spyOn(globalThis, 'alert');
    const warnSpy = spyOn(console, 'warn');
    const fetchSpy = spyOn(globalThis, 'fetch');

    (component as any).idPlantaUsuario = 10;

    component.nuevoCuidado = {
      fecha: '',
      tipo_cuidado: 'Fertilización',
      detalles: 'Aplicación'
    };

    // Act
    component.guardarCuidado();

    // Assert
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Falta fecha (YYYY-MM-DD)');
    expect(warnSpy).toHaveBeenCalled();
    expect(component.nuevoCuidado.fecha).toBe('');
    expect(component.nuevoCuidado.tipo_cuidado).toBe('Fertilización');
    expect(component.nuevoCuidado.detalles).toBe('Aplicación');
  });
});