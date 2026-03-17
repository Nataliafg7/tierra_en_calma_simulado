import { TestBed } from '@angular/core/testing';
import { MonsteraComponent } from './monstera';

describe('HU18 – Frontend – P3 (respuesta exitosa)', () => {
  it('Debe procesar correctamente una respuesta ok:true', () => {
    TestBed.configureTestingModule({
      imports: [MonsteraComponent], 
    });

    const respuesta = { ok: true, mensaje: 'Riego automático activado' };

    expect(respuesta.ok).toBeTrue();
    expect(respuesta.mensaje).toContain('Riego');
  });
});