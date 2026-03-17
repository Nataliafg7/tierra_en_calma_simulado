import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HeaderPrivadoComponent } from './header-privado';

describe('HU7 – Frontend – P1 (campos vacíos)', () => {
  let fixture: ComponentFixture<HeaderPrivadoComponent>;
  let component: HeaderPrivadoComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPrivadoComponent, HttpClientTestingModule],
      providers: [provideRouter([])], // <- CLAVE para RouterLink/ActivatedRoute
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderPrivadoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Debe alertar y cortar el flujo cuando faltan campos obligatorios', () => {
    const alertSpy = spyOn(window, 'alert');

    // Ajusta si tu componente usa FormGroup
    (component as any).nombre = '';
    (component as any).correo = '';
    (component as any).mensaje = '';

    component.enviarFormulario();

    expect(alertSpy).toHaveBeenCalled();

    // No debe intentar hacer POST al backend
    const reqs = httpMock.match((req) => req.url.includes('contacto'));
    expect(reqs.length).toBe(0);
  });
});