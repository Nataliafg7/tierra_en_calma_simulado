import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { RegistrarPlantasComponent } from '../registrar-plantas';

describe('HU8 – Frontend – P1: Carga exitosa del banco de especies', () => {
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
    httpMock.verify(); // FIRST: asegura que no queden peticiones HTTP pendientes
  });

  it('HU8F_P1 - Debe construir el mapa plantaIds cuando la carga es exitosa', () => {
    // ===================== ARRANGE =====================
    // Se prepara una respuesta con nombres que requieren normalización: espacios, mayúsculas y tildes
    // FIRST: no depende de backend real porque HttpTestingController controla la petición HTTP
    const plantasMock = [
      { ID_PLANTA: 10, NOMBRE_COMUN: 'Aloe Vera' },
      { ID_PLANTA: 20, NOMBRE_COMUN: 'Café de sombra' }
    ];

    const consoleLogSpy = spyOn(console, 'log');

    // ======================= ACT =======================
    // detectChanges ejecuta ngOnInit y dispara la carga del banco de especies
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/plantas`);

    expect(req.request.method).toBe('GET');
    // Fluent assertion: valida de forma clara que el componente usa el método HTTP correcto

    req.flush(plantasMock);

    // ===================== ASSERT ======================
    // Se inspecciona el mapa interno para verificar que las claves fueron normalizadas correctamente
    const mapaPlantaIds = (component as any).plantaIds as Record<string, number>;

    expect(mapaPlantaIds).toEqual({
      'aloe-vera': 10,
      'cafe-de-sombra': 20
    });
    // Fluent assertion: valida el contrato completo del mapa construido a partir del banco de especies

    expect(consoleLogSpy).toHaveBeenCalled();
    // Fluent assertion: confirma que se registró información del flujo exitoso

    expect(consoleLogSpy.calls.mostRecent().args[0]).toContain('Mapa de plantas cargado');
    // Fluent assertion: valida que la rama exitosa de carga fue alcanzada

    // FIRST: prueba rápida, independiente, repetible y self-validating por sus propios expects
  });
});