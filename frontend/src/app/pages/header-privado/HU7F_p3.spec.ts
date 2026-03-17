import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HeaderPrivadoComponent } from './header-privado';

describe('HU7 – Frontend – P3 (error HTTP)', () => {
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

  it('Debe manejar el error: console.error + alert de fallo', () => {
    const alertSpy = spyOn(window, 'alert');
    const consoleSpy = spyOn(console, 'error');

    // Ajusta si tu componente usa FormGroup
    (component as any).nombre = 'Natalia';
    (component as any).correo = 'natalia@test.com';
    (component as any).mensaje = 'Probando error';

    component.enviarFormulario();

    const reqs = httpMock.match((req) => req.url.includes('contacto'));
    expect(reqs.length).toBe(1);

    const req = reqs[0];
    expect(req.request.method).toBe('POST');

    req.flush({ error: 'Error al enviar el correo' }, { status: 500, statusText: 'Server Error' });

    expect(consoleSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });
});