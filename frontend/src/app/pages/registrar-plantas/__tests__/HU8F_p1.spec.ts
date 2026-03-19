import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RegistrarPlantasComponent } from '../registrar-plantas'; 

describe('HU8 – Frontend – Escenario 1 (P1) – Carga exitosa del banco de especies (GET /api/plantas)', () => {
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let component: RegistrarPlantasComponent;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:3000/api';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistrarPlantasComponent, // componente standalone
        HttpClientTestingModule
      ],
      providers: [
        // Router se inyecta en el componente; para P1 no se usa navigate,
        // pero lo proveemos para evitar errores de inyección.
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica que no queden requests pendientes
    httpMock.verify();
  });

  it('P1 – Debe construir el mapa plantaIds cuando la carga es exitosa', () => {
    // Espiamos el log para confirmar que el flujo exitoso finaliza
    spyOn(console, 'log');

    // Dispara ngOnInit() → cargarPlantas()
    fixture.detectChanges();

    // Captura la petición real que hace el componente
    const req = httpMock.expectOne(`${API_URL}/plantas`);
    expect(req.request.method).toBe('GET');

    // Respuesta exitosa simulada (sin tocar el server)
    // Incluimos casos con tildes y espacios para validar normalización del key
    req.flush([
      { ID_PLANTA: 10, NOMBRE_COMUN: 'Aloe Vera' },
      { ID_PLANTA: 20, NOMBRE_COMUN: 'Café de sombra' }
    ]);

    // Accedemos al private plantaIds (en TS es privado a nivel de compilación)
    const mapa = (component as any).plantaIds as Record<string, number>;

    // Validaciones del mapeo construido
    expect(mapa['aloe-vera']).toBe(10);        // espacios → guión, minúsculas
    expect(mapa['cafe-de-sombra']).toBe(20);   // tilde removida

    // Debe registrar que cargó el mapa
    expect(console.log).toHaveBeenCalled();
    // (Opcional) Validación del mensaje exacto
    expect((console.log as any).calls.mostRecent().args[0]).toContain('Mapa de plantas cargado');
  });
});