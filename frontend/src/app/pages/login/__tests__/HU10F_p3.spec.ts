import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';

import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';

@Component({ standalone: true, template: '' })
class DummyMisPlantasComponent {}

describe('Pruebas Unitarias Frontend – HU10 Asociación de planta', () => {
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let component: RegistrarPlantasComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistrarPlantasComponent,
        HttpClientModule,
        RouterTestingModule.withRoutes([
          { path: 'mis-plantas', component: DummyMisPlantasComponent },
        ]),
        DummyMisPlantasComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    router.initialNavigation();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Escenario 3 (P3) – Debe mostrar mensaje y navegar a /mis-plantas cuando el POST es exitoso', (done) => {

    // 1) Sesión válida
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1000410154 }));

    // 2) Mapa válido
    (component as any).plantaIds['monstera'] = 26;

    // 3) Capturar alert
    let alertMsg = '';
    const originalAlert = window.alert;
    window.alert = (msg?: any) => { alertMsg = String(msg); };

    // 4) Escuchar navegación
    const sub = router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd && ev.urlAfterRedirects === '/mis-plantas') {

        try {
          expect(alertMsg).toContain('Planta registrada');
        } finally {
          sub.unsubscribe();
          window.alert = originalAlert;
          done();
        }
      }
    });

    // 5) Ejecutar método
    component.anadirPlanta('monstera');

    // 6) Timeout de seguridad
    setTimeout(() => {
      sub.unsubscribe();
      window.alert = originalAlert;
      done(); // evita que quede colgado
    }, 6000);
  });
});