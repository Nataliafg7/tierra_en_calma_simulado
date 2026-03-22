import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HeaderPrivadoComponent } from './header-privado';

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
    // Arrange
    const alertSpy = spyOn(window, 'alert');

    (component as any).nombre = 'Natalia';
    (component as any).correo = 'natalia@test.com';
    (component as any).mensaje = 'Hola, esto es una prueba';

    // Act
    component.enviarFormulario();

    const reqs = httpMock.match((req) => req.url.includes('contacto'));
    expect(reqs.length).toBe(1);

    const req = reqs[0];

    req.flush(
      { message: 'Mensaje enviado correctamente' },
      { status: 200, statusText: 'OK' }
    );

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombre: 'Natalia',
      correo: 'natalia@test.com',
      mensaje: 'Hola, esto es una prueba',
    });

    expect(alertSpy).toHaveBeenCalled();

    expect((component as any).nombre).toBeFalsy();
    expect((component as any).correo).toBeFalsy();
    expect((component as any).mensaje).toBeFalsy();
  });
});