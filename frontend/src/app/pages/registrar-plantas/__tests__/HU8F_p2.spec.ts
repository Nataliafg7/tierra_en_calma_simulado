import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { RegistrarPlantasComponent } from '../registrar-plantas';

describe('HU8 – Frontend – P2: Error al cargar plantas', () => {
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let component: RegistrarPlantasComponent;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:3000/api';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistrarPlantasComponent,
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // FIRST: garantiza que no queden peticiones HTTP pendientes
  });

  it('HU8F_P2 - Debe mostrar alert y registrar error cuando falla el GET de plantas', () => {
    // ===================== ARRANGE =====================
    // Se preparan spies para validar el manejo del error sin mostrar mensajes reales durante la prueba
    // FIRST: el error HTTP es controlado por HttpTestingController, sin backend real
    const consoleErrorSpy = spyOn(console, 'error');
    const alertSpy = spyOn(window, 'alert');

    // ======================= ACT =======================
    // detectChanges ejecuta ngOnInit y dispara cargarPlantas()
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/plantas`);

    expect(req.request.method).toBe('GET');
    // Fluent assertion: valida que la solicitud use el método HTTP esperado

    req.flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    // ===================== ASSERT ======================
    expect(consoleErrorSpy).toHaveBeenCalled();
    // Fluent assertion: confirma que el error fue registrado por consola

    expect(alertSpy).toHaveBeenCalledOnceWith('No se pudieron cargar las plantas desde el servidor');
    // Fluent assertion: valida el mensaje exacto mostrado al usuario cuando falla la carga

    expect(component).toBeTruthy();
    // Fluent assertion: confirma que el componente sigue creado aunque ocurra el error

    const mapaPlantaIds = (component as any).plantaIds as Record<string, number>;

    expect(mapaPlantaIds).toEqual({});
    // Fluent assertion: valida que no se construya mapa de plantas cuando el backend falla

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});