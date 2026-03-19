/**
 * HU1F - Registro (Frontend Angular)
 * Escenario P2: Registro exitoso (camino feliz)
 *
 * Nota importante:
 * Para que la prueba NO falle al ejecutarla varias veces, se generan
 * id_usuario y correo únicos en cada corrida.
 *
 * Restricción:
 * - Sin mocks
 * - Sin spies
 * - Solo assertions (expect)
 */

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

describe('HU1F - Registro Frontend (P2)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} }, queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('HU1F_P2 - Debe registrar correctamente y ejecutar showLogin()', fakeAsync(() => {
    // 1) Generamos datos únicos para que la prueba sea repetible
    const unico = Date.now(); // cambia en cada corrida
    const idUnico = `${unico}`; // id como string (tu componente lo maneja como string)
    const correoUnico = `p2_${unico}@mail.com`;

    // 2) Simulamos que estamos en la vista de registro
    component.isContainerActive = true;

    // 3) Llenamos campos (una sola vez, con valores únicos)
    component.regIdUsuario = ` ${idUnico} `;
    component.regNombre = ' Juliana ';
    component.regApellido = ' Casas ';
    component.regTelefono = ' 3000000000 ';
    component.regCorreo = ` ${correoUnico} `;
    component.regContrasena = ' 1234 ';

    // 4) Evento sin spy: bandera
    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => { preventDefaultEjecutado = true; }
    } as unknown as Event;

    // 5) Ejecutamos
    component.onRegisterSubmit(event);

    // 6) Assertions
    expect(preventDefaultEjecutado).toBeTrue();

    // 7) Debe salir una petición POST a /register
    const req = httpMock.expectOne(r =>
      r.method === 'POST' && r.url.endsWith('/register')
    );

    expect(req.request.method).toBe('POST');

    // 8) Body esperado (ya con trim aplicado)
    expect(req.request.body).toEqual({
      id_usuario: idUnico,
      nombre: 'Juliana',
      apellido: 'Casas',
      telefono: '3000000000',
      correo_electronico: correoUnico,
      contrasena: '1234'
    });

    // 9) Simulamos éxito (rama next)
    req.flush({ message: 'Usuario registrado con éxito.' });

    // 10) showLogin() activa transición y luego cambia estados a los 150ms
    expect(component.isTransitioning).toBeTrue();
    tick(150);

    expect(component.isContainerActive).toBeFalse();
    expect(component.isTransitioning).toBeFalse();
  }));
});