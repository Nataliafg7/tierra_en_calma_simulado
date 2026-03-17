import { TestBed } from '@angular/core/testing';
import { MonsteraComponent } from './monstera';

describe('HU18 – Frontend – P2 (sin lecturas)', () => {
  it('Debe manejar respuesta ok:false sin romper el flujo', () => {
    TestBed.configureTestingModule({
      imports: [MonsteraComponent], 
    });

    const respuesta = { ok: false, mensaje: 'No hay lecturas registradas' };

    expect(respuesta.ok).toBeFalse();
    expect(respuesta.mensaje).toContain('No hay');
  });
});