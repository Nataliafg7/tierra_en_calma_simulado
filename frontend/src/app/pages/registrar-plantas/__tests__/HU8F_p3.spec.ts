import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { RegistrarPlantasComponent } from '../registrar-plantas';

describe('HU8 – Frontend – P3: Respuesta exitosa con arreglo vacío', () => {
  let component: RegistrarPlantasComponent;
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
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
    httpMock.verify(); // FIRST: asegura que no queden solicitudes HTTP pendientes
  });

  it('HU8F_P3 - Debe manejar correctamente una respuesta exitosa con lista vacía', () => {
    // ===================== ARRANGE =====================
    // Se prepara una respuesta exitosa sin plantas para validar el caso límite de lista vacía
    // FIRST: no depende de backend real porque la respuesta HTTP se controla desde la prueba
    const plantasMock: any[] = [];

    const consoleLogSpy = spyOn(console, 'log');

    // ======================= ACT =======================
    // detectChanges ejecuta ngOnInit y dispara cargarPlantas()
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/plantas`);

    expect(req.request.method).toBe('GET');
    // Fluent assertion: valida que el componente realiza la consulta con el método HTTP esperado

    req.flush(plantasMock);

    // ===================== ASSERT ======================
    const mapaPlantaIds = (component as any).plantaIds as Record<string, number>;

    expect(mapaPlantaIds).toEqual({});
    // Fluent assertion: valida que el mapa queda vacío cuando el backend responde sin plantas

    expect(consoleLogSpy).toHaveBeenCalledOnceWith(
      'Mapa de plantas cargado:',
      {}
    );
    // Fluent assertion: valida el registro exacto del resultado exitoso con mapa vacío

    expect(component).toBeTruthy();
    // Fluent assertion: confirma que el componente sigue en estado válido

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});