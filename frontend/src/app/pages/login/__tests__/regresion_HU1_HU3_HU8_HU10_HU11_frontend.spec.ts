/**
 * PRUEBAS DE REGRESIÓN - FRONTEND
 *
 * Historias evaluadas:
 * HU1  - Registro de usuario
 * HU3  - Inicio de sesión
 * HU8  - Consulta del banco de especies
 * HU10 - Asociación de plantas a un usuario
 * HU11 - Visualización de plantas registradas
 *
 * Propósito:
 * Verificar que los componentes principales del frontend
 * se sigan creando correctamente después de cambios en el código.
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from '../login';
import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';
import { MisPlantasComponent } from '../../mis-plantas/mis-plantas';

describe('Regresión frontend - HU1, HU3, HU8, HU10 y HU11', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        RegistrarPlantasComponent,
        MisPlantasComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('HU1 - debe crear correctamente la pantalla donde se realiza el registro de usuario', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('HU3 - debe crear correctamente la pantalla de inicio de sesión', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('HU8 - debe crear correctamente la pantalla de consulta del banco de especies', () => {
    const fixture = TestBed.createComponent(RegistrarPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('HU10 - debe crear correctamente la pantalla de asociación de plantas', () => {
    const fixture = TestBed.createComponent(RegistrarPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('HU11 - debe crear correctamente la pantalla de plantas registradas', () => {
    const fixture = TestBed.createComponent(MisPlantasComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });
});