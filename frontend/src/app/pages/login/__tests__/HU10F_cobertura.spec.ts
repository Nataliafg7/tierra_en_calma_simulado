import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';

describe('RegistrarPlantasComponent - HU10 cobertura', () => {
  let component: RegistrarPlantasComponent;
  let fixture: ComponentFixture<RegistrarPlantasComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegistrarPlantasComponent,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarPlantasComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe llamar cargarPlantas al iniciar el componente', () => {
    // Arrange
    const cargarPlantasSpy = spyOn(component, 'cargarPlantas');

    // Act
    component.ngOnInit();

    // Assert
    expect(cargarPlantasSpy).toHaveBeenCalled();
  });

  it('debe cargar plantas y construir correctamente el mapa de IDs normalizando nombres', () => {
    // Arrange
    const consoleSpy = spyOn(console, 'log');

    // Act
    component.cargarPlantas();

    const req = httpMock.expectOne('http://localhost:3000/api/plantas');
    expect(req.request.method).toBe('GET');

    req.flush([
      { ID_PLANTA: 1, NOMBRE_COMUN: 'Potus' },
      { ID_PLANTA: 2, NOMBRE_COMUN: 'Lengua de Suegra' },
      { ID_PLANTA: 3, NOMBRE_COMUN: 'Dólar Aglaonema' },
      { ID_PLANTA: 4, NOMBRE_COMUN: 'Hoja de Violín' }
    ]);

    // Assert
    expect((component as any).plantaIds['potus']).toBe(1);
    expect((component as any).plantaIds['lengua-de-suegra']).toBe(2);
    expect((component as any).plantaIds['dolar-aglaonema']).toBe(3);
    expect((component as any).plantaIds['hoja-de-violin']).toBe(4);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('debe mostrar una alerta cuando falle la carga de plantas', () => {
    // Arrange
    const alertSpy = spyOn(window, 'alert');
    const errorSpy = spyOn(console, 'error');

    // Act
    component.cargarPlantas();

    const req = httpMock.expectOne('http://localhost:3000/api/plantas');
    expect(req.request.method).toBe('GET');

    req.flush('error de carga', {
      status: 500,
      statusText: 'Internal Server Error'
    });

    // Assert
    expect(errorSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('No se pudieron cargar las plantas desde el servidor');
  });

  it('debe redirigir al login si el usuario no ha iniciado sesión al intentar añadir una planta', () => {
    // Arrange
    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');
    (component as any).plantaIds['potus'] = 1;

    // Act
    component.anadirPlanta('potus');

    // Assert
    expect(alertSpy).toHaveBeenCalledWith('Debes iniciar sesión antes de añadir plantas');
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    httpMock.expectNone('http://localhost:3000/api/registrar-planta');
  });

  it('debe mostrar una alerta cuando no exista el ID de la planta seleccionada', () => {
    // Arrange
    const alertSpy = spyOn(window, 'alert');
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 25 }));

    // Act
    component.anadirPlanta('potus');

    // Assert
    expect(alertSpy).toHaveBeenCalledWith('No se encontró el ID de la planta seleccionada');
    httpMock.expectNone('http://localhost:3000/api/registrar-planta');
  });

  it('debe registrar la planta correctamente y redirigir a mis-plantas', () => {
    // Arrange
    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');

    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 12 }));
    (component as any).plantaIds['potus'] = 1;

    // Act
    component.anadirPlanta('potus');

    const req = httpMock.expectOne('http://localhost:3000/api/registrar-planta');

    // Assert request
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_usuario: 12,
      id_planta: 1
    });

    // Act response
    req.flush({ message: 'Planta registrada correctamente' });

    // Assert final
    expect(alertSpy).toHaveBeenCalledWith('Planta registrada correctamente');
    expect(navigateSpy).toHaveBeenCalledWith(['/mis-plantas']);
  });

  it('debe mostrar una alerta cuando ocurra un error al registrar la planta', () => {
    // Arrange
    const alertSpy = spyOn(window, 'alert');
    const errorSpy = spyOn(console, 'error');

    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 12 }));
    (component as any).plantaIds['potus'] = 1;

    // Act
    component.anadirPlanta('potus');

    const req = httpMock.expectOne('http://localhost:3000/api/registrar-planta');
    expect(req.request.method).toBe('POST');

    req.flush('error al registrar', {
      status: 500,
      statusText: 'Internal Server Error'
    });

    // Assert
    expect(errorSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('No se pudo añadir la planta');
  });

  it('debe usar el ID_USUARIO almacenado en localStorage al construir el body del registro', () => {
    // Arrange
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 99 }));
    (component as any).plantaIds['lengua-de-suegra'] = 7;

    // Act
    component.anadirPlanta('lengua-de-suegra');

    const req = httpMock.expectOne('http://localhost:3000/api/registrar-planta');

    // Assert
    expect(req.request.body.id_usuario).toBe(99);
    expect(req.request.body.id_planta).toBe(7);

    req.flush({ message: 'Registro exitoso' });
  });
});