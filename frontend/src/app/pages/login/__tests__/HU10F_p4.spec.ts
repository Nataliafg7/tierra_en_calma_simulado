import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';

describe('Pruebas Unitarias Frontend – HU10 Asociación de planta', () => {
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let component: RegistrarPlantasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistrarPlantasComponent,
        HttpClientModule, // HTTP real
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Escenario 4 (P4) – Debe mostrar alerta de error cuando el POST falla', (done) => {
    // 1) Sesión válida
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1 }));

    // 2) Forzar error real: id_planta inválido (provoca 500 en backend)
    (component as any).plantaIds['monstera'] = 99999999;

    // 3) Capturar alert
    let alertMsg = '';
    const originalAlert = window.alert;
    window.alert = (msg?: any) => { alertMsg = String(msg); };

    // 4) Capturar console.error (solo para confirmar que entró al error)
    let consoleCalled = false;
    const originalConsoleError = console.error;
    console.error = () => { consoleCalled = true; };

    // 5) Ejecutar
    component.anadirPlanta('monstera');

    // 6) Esperar respuesta real
    setTimeout(() => {
      try {
        expect(consoleCalled).toBeTrue();
        expect(alertMsg).toBe('No se pudo añadir la planta');
      } finally {
        // restaurar
        window.alert = originalAlert;
        console.error = originalConsoleError;
        done();
      }
    }, 4000);
  });
});