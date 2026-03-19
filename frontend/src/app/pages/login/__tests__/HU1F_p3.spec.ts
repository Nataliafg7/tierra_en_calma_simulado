/**
 * HU1F - Registro (Frontend Angular)
 * Escenario P3: Error por duplicado (mismos datos de entrada dos veces)
 *
 * Estrategia:
 * - Se ejecuta onRegisterSubmit() 2 veces con el MISMO id_usuario y correo.
 * - La primera debería registrar exitoso.
 * - La segunda debe fallar por duplicado y entrar a la rama error.
 *
 * Restricción:
 * - Sin mocks
 * - Sin spies
 * - Solo assertions (expect)
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('HU1F - Registro Frontend (P3 duplicado real)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} }, queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('HU1F_P3 - Debe fallar el segundo registro por duplicado y NO ejecutar showLogin()', async () => {
    // 1) Datos únicos para que el primer registro casi seguro no exista
    const unico = Date.now();
    const idRepetido = `${unico}`;
    const correoRepetido = `p3_${unico}@mail.com`;

    // 2) Dejamos el componente en vista registro
    component.isContainerActive = true;

    // 3) Cargamos inputs (los mismos para ambos submits)
    component.regIdUsuario = idRepetido;
    component.regNombre = 'Prueba';
    component.regApellido = 'Duplicado';
    component.regTelefono = '3000000000';
    component.regCorreo = correoRepetido;
    component.regContrasena = '1234';

    // 4) Evento submit sin spy
    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => { preventDefaultEjecutado = true; }
    } as unknown as Event;

    // ===== Submit #1 (debería ser éxito) =====
    component.onRegisterSubmit(event);
    expect(preventDefaultEjecutado).toBeTrue();

    // Espera para que el backend procese y haga commit
    await delay(700);

    // ===== Submit #2 (mismos datos => duplicado real => error) =====
    component.onRegisterSubmit(event);

    // Espera a que llegue la respuesta de error
    await delay(700);

    // 5) Assertions clave:
    // Si fue error, NO debe ejecutar showLogin() => se queda en registro
    expect(component.isContainerActive).toBeTrue();

    // showLogin() activa transición; en error debería quedarse false
    expect(component.isTransitioning).toBeFalse();
  });
});