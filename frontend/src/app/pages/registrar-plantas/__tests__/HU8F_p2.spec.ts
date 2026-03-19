import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RegistrarPlantasComponent } from '../registrar-plantas'; // ajusta si tu ruta difiere

describe('HU8 – Frontend – Escenario 2 (P2) – Error al cargar plantas (GET /api/plantas)', () => {
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let component: RegistrarPlantasComponent;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:3000/api';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarPlantasComponent, HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('P2 – Debe ejecutar console.error y mostrar alert cuando el GET falla', () => {
    spyOn(console, 'error');
    spyOn(window, 'alert');

    // dispara ngOnInit() => cargarPlantas()
    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/plantas`);
    expect(req.request.method).toBe('GET');

    // Forzamos un error HTTP (simula caída del backend)
    req.flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('No se pudieron cargar las plantas desde el servidor');

    // (Opcional) verificar que el componente no explota y sigue existiendo
    expect(component).toBeTruthy();
  });
});