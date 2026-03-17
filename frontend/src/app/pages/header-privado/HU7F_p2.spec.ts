import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HeaderPrivadoComponent } from './header-privado';
import { ContactoService } from 'src/app/services/contacto.service';

describe('HU7 – Frontend – P2 (envío exitoso)', () => {
  let fixture: ComponentFixture<HeaderPrivadoComponent>;
  let component: HeaderPrivadoComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPrivadoComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderPrivadoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Debe llamar al backend, mostrar alerta de éxito y resetear el formulario', () => {
    const alertSpy = spyOn(window, 'alert');

    // Ajusta si tu componente usa FormGroup
    (component as any).nombre = 'Natalia';
    (component as any).correo = 'natalia@test.com';
    (component as any).mensaje = 'Hola, esto es una prueba';

    component.enviarFormulario();

    // Match flexible (sirve si es /api/contacto o http://.../api/contacto, etc)
    const reqs = httpMock.match((req) => req.url.includes('contacto'));
    expect(reqs.length).toBe(1);

    const req = reqs[0];
    expect(req.request.method).toBe('POST');

    // Opcional: validar body (si tu código envía estas keys)
    expect(req.request.body).toEqual({
      nombre: 'Natalia',
      correo: 'natalia@test.com',
      mensaje: 'Hola, esto es una prueba',
    });

    req.flush({ message: 'Mensaje enviado correctamente' }, { status: 200, statusText: 'OK' });

    expect(alertSpy).toHaveBeenCalled();

    // Reset esperado (ajusta si tu reset es distinto)
    expect((component as any).nombre).toBeFalsy();
    expect((component as any).correo).toBeFalsy();
    expect((component as any).mensaje).toBeFalsy();
  });
});