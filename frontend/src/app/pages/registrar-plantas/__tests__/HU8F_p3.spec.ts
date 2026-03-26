import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RegistrarPlantasComponent } from '../registrar-plantas';

describe('HU8 – Frontend – Escenario 3 (P3) – Respuesta exitosa con arreglo vacío', () => {

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
        /**
         * Mock de Router.
         * No se evalúa navegación en este escenario, pero el componente
         * requiere la dependencia, por lo que se simula para permitir
         * su correcta instanciación en el entorno de pruebas.
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
     * Verifica que no existan solicitudes HTTP pendientes,
     * asegurando el aislamiento del escenario de prueba.
     */
    httpMock.verify();
  });

  it('P3 – Debe manejar correctamente una respuesta exitosa con lista vacía', () => {

    /**
     * Objetivo:
     * Validar que el componente maneje correctamente una respuesta exitosa
     * del backend cuando no existen plantas disponibles (arreglo vacío).
     *
     * Justificación técnica:
     * Este escenario cubre un caso límite del flujo exitoso de HU8, donde
     * el backend responde sin datos. Se espera que el componente no falle,
     * mantenga su estado consistente y registre correctamente el resultado.
     */

    // =========================
    // Arrange
    // =========================
    const consoleLogSpy = spyOn(console, 'log');

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
     * Se simula una respuesta exitosa sin datos
     */
    req.flush([]);

    // =========================
    // Assert
    // =========================
    /**
     * Se valida que el componente registre en consola
     * un mapa vacío sin generar errores.
     */
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Mapa de plantas cargado:',
      {}
    );

    /**
     * Se verifica que el componente continúa en estado válido
     */
    expect(component).toBeTruthy();
  });

});