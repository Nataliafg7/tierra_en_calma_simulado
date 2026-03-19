import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';

describe('Pruebas Unitarias Frontend – HU10 Asociación de planta', () => {
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let component: RegistrarPlantasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistrarPlantasComponent,
        HttpClientTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Escenario 2 (P2) – Debe alertar si no existe el ID de la planta seleccionada', () => {
    // Precondición: sesión válida (para pasar el primer if)
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1 }));

    // Precondición: mapa de plantas vacío (id_planta será undefined)
    // No se llama cargarPlantas() aquí; solo evaluamos el método con el estado actual.

    // Capturar alert
    let alertMsg = '';
    const originalAlert = window.alert;
    window.alert = (msg?: any) => { alertMsg = String(msg); };

    // Ejecutar con un tipo que no está en el mapa
    component.anadirPlanta('planta-inexistente');

    // Restaurar alert
    window.alert = originalAlert;

    // Assertions
    expect(alertMsg).toBe('No se encontró el ID de la planta seleccionada');
  });
});