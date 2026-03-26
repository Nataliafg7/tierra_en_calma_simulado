import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RegistrarPlantasComponent } from '../registrar-plantas';

describe('HU8 – Frontend – Escenario 2 (P2) – Error al cargar plantas (GET /api/plantas)', () => {
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
         * No se evalúa navegación en este escenario, pero el componente
         * requiere la dependencia para su correcta instanciación.
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
     * Garantiza que no queden solicitudes HTTP pendientes,
     * asegurando el aislamiento del escenario de prueba.
     */
    httpMock.verify();
  });

  it('P2 – Debe ejecutar console.error y mostrar alert cuando el GET falla', () => {

    /**
     * Objetivo:
     * Verificar que el componente maneje correctamente un error del backend
     * al intentar cargar el banco de especies.
     *
     * Justificación técnica:
     * Este escenario valida la rama de error del flujo de HU8, comprobando
     * que se registre el error en consola y se notifique al usuario mediante
     * una alerta, sin romper la ejecución del componente.
     */

    // =========================
    // Arrange
    // =========================
    const consoleErrorSpy = spyOn(console, 'error');
    const alertSpy = spyOn(window, 'alert');

    // =========================
    // Act
    // =========================
    /**
     * Ejecuta ngOnInit() → cargarPlantas()
     */
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/plantas`);
    expect(req.request.method).toBe('GET');

    /**
     * Se simula un error del backend (HTTP 500)
     */
    req.flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    // =========================
    // Assert
    // =========================
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('No se pudieron cargar las plantas desde el servidor');

    /**
     * Se valida que el componente no falle y continúe en estado válido
     */
    expect(component).toBeTruthy();
  });
});