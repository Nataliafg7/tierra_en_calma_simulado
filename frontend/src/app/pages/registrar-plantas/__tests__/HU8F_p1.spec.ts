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
        RegistrarPlantasComponent,
        HttpClientTestingModule
      ],
      providers: [
        /**
         * Mock de Router.
         * En este escenario no se evalúa navegación, pero el componente
         * lo inyecta en el constructor, por lo que se provee para evitar
         * errores de dependencia durante la creación del componente.
         */
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
    /**
     * Verifica que no queden solicitudes HTTP pendientes al finalizar
     * cada prueba, garantizando aislamiento y limpieza del escenario.
     */
    httpMock.verify();
  });

  it('P1 – Debe construir el mapa plantaIds cuando la carga es exitosa', () => {
    /**
     * Objetivo:
     * Verificar que, cuando el backend responde exitosamente con el banco
     * de especies, el componente construya correctamente el mapa interno
     * de IDs de plantas usando nombres normalizados.
     *
     * Justificación técnica:
     * Este escenario valida el flujo principal exitoso de HU8 en el frontend.
     * Además, comprueba que la transformación aplicada a NOMBRE_COMUN
     * convierta el texto a minúsculas, remueva tildes y reemplace espacios
     * por guiones, tal como lo requiere la lógica del componente.
     */

    // =========================
    // Arrange
    // =========================
    const consoleLogSpy = spyOn(console, 'log');

    // =========================
    // Act
    // =========================
    /**
     * fixture.detectChanges() ejecuta ngOnInit(), y desde allí
     * se invoca cargarPlantas(), disparando la petición GET real
     * dentro del entorno de pruebas.
     */
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/plantas`);
    expect(req.request.method).toBe('GET');

    /**
     * Se simula una respuesta exitosa del backend incluyendo:
     * - un nombre con espacio
     * - un nombre con tilde
     * para validar la normalización de claves del mapa.
     */
    req.flush([
      { ID_PLANTA: 10, NOMBRE_COMUN: 'Aloe Vera' },
      { ID_PLANTA: 20, NOMBRE_COMUN: 'Café de sombra' }
    ]);

    // =========================
    // Assert
    // =========================
    /**
     * Aunque plantaIds es private, en pruebas puede inspeccionarse
     * mediante casting para verificar el estado interno construido
     * por el flujo exitoso.
     */
    const mapa = (component as any).plantaIds as Record<string, number>;

    expect(mapa['aloe-vera']).toBe(10);
    expect(mapa['cafe-de-sombra']).toBe(20);

    /**
     * Se valida que el flujo finalice por la rama exitosa y registre
     * en consola el mensaje esperado de carga del mapa.
     */
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy.calls.mostRecent().args[0]).toContain('Mapa de plantas cargado');
  });
});