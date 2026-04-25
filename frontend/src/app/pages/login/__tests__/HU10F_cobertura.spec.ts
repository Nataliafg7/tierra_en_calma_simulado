import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { RegistrarPlantasComponent } from '../../registrar-plantas/registrar-plantas';

describe('HU10F - RegistrarPlantasComponent', () => {
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

    localStorage.clear(); // FIRST: evita contaminación entre pruebas
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('HU10F P1 - Debe llamar cargarPlantas al iniciar el componente', () => {
    // ===================== ARRANGE =====================
    const cargarPlantasSpy = spyOn(component, 'cargarPlantas');

    // ======================= ACT =======================
    component.ngOnInit();

    // ===================== ASSERT ======================
    expect(cargarPlantasSpy).toHaveBeenCalledTimes(1);
    // Fluent assertion: valida que al iniciar el componente se cargan las plantas

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });

  it('HU10F P2 - Debe cargar plantas y construir correctamente el mapa de IDs normalizando nombres', () => {
    // ===================== ARRANGE =====================
    const consoleSpy = spyOn(console, 'log');

    // ======================= ACT =======================
    component.cargarPlantas();

    const req = httpMock.expectOne('http://localhost:3000/api/plantas');

    expect(req.request.method).toBe('GET');
    // Fluent assertion: valida que se consulta el endpoint correcto con método GET

    req.flush([
      { ID_PLANTA: 1, NOMBRE_COMUN: 'Potus' },
      { ID_PLANTA: 2, NOMBRE_COMUN: 'Lengua de Suegra' },
      { ID_PLANTA: 3, NOMBRE_COMUN: 'Dólar Aglaonema' },
      { ID_PLANTA: 4, NOMBRE_COMUN: 'Hoja de Violín' }
    ]);

    // ===================== ASSERT ======================
    expect((component as any).plantaIds).toEqual(
      jasmine.objectContaining({
        'potus': 1,
        'lengua-de-suegra': 2,
        'dolar-aglaonema': 3,
        'hoja-de-violin': 4
      })
    );
    // Fluent assertion: valida que los nombres se normalizan y se asocian con su ID

    expect(consoleSpy).toHaveBeenCalled();
    // Fluent assertion: confirma que se registró información de carga en consola

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });

  it('HU10F P3 - Debe mostrar una alerta cuando falle la carga de plantas', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');
    const errorSpy = spyOn(console, 'error');

    // ======================= ACT =======================
    component.cargarPlantas();

    const req = httpMock.expectOne('http://localhost:3000/api/plantas');

    expect(req.request.method).toBe('GET');
    // Fluent assertion: valida que se intentó consultar el listado de plantas

    req.flush('error de carga', {
      status: 500,
      statusText: 'Internal Server Error'
    });

    // ===================== ASSERT ======================
    expect(errorSpy).toHaveBeenCalled();
    // Fluent assertion: valida que el error fue registrado en consola

    expect(alertSpy).toHaveBeenCalledWith('No se pudieron cargar las plantas desde el servidor');
    // Fluent assertion: valida que se informa al usuario el error de carga

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });

  it('HU10F P4 - Debe redirigir al login si el usuario no ha iniciado sesión al intentar añadir una planta', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');

    (component as any).plantaIds['potus'] = 1;

    // ======================= ACT =======================
    component.anadirPlanta('potus');

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('Debes iniciar sesión antes de añadir plantas');
    // Fluent assertion: valida que se alerta al usuario cuando no hay sesión

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    // Fluent assertion: valida que se redirige al login

    httpMock.expectNone('http://localhost:3000/api/registrar-planta');
    // Fluent assertion: confirma que no se hace POST si el usuario no inició sesión

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });

  it('HU10F P5 - Debe mostrar una alerta cuando no exista el ID de la planta seleccionada', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');

    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 25 }));

    // ======================= ACT =======================
    component.anadirPlanta('potus');

    // ===================== ASSERT ======================
    expect(alertSpy).toHaveBeenCalledWith('No se encontró el ID de la planta seleccionada');
    // Fluent assertion: valida que se informa cuando la planta no tiene ID asociado

    httpMock.expectNone('http://localhost:3000/api/registrar-planta');
    // Fluent assertion: confirma que no se hace POST si no existe ID de planta

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });

  it('HU10F P6 - Debe registrar la planta correctamente y redirigir a mis-plantas', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');
    const navigateSpy = spyOn(router, 'navigate');

    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 12 }));
    (component as any).plantaIds['potus'] = 1;

    // ======================= ACT =======================
    component.anadirPlanta('potus');

    const req = httpMock.expectOne('http://localhost:3000/api/registrar-planta');

    // ===================== ASSERT REQUEST ======================
    expect(req.request.method).toBe('POST');
    // Fluent assertion: valida que se registra la planta con método POST

    expect(req.request.body).toEqual({
      id_usuario: 12,
      id_planta: 1
    });
    // Fluent assertion: valida que el body contiene el usuario y la planta correcta

    // ===================== ACT RESPONSE ======================
    req.flush({ message: 'Planta registrada correctamente' });

    // ===================== ASSERT FINAL ======================
    expect(alertSpy).toHaveBeenCalledWith('Planta registrada correctamente');
    // Fluent assertion: valida que se muestra el mensaje exitoso del backend

    expect(navigateSpy).toHaveBeenCalledWith(['/mis-plantas']);
    // Fluent assertion: valida que se redirige al listado de plantas del usuario

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });

  it('HU10F P7 - Debe mostrar una alerta cuando ocurra un error al registrar la planta', () => {
    // ===================== ARRANGE =====================
    const alertSpy = spyOn(window, 'alert');
    const errorSpy = spyOn(console, 'error');

    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 12 }));
    (component as any).plantaIds['potus'] = 1;

    // ======================= ACT =======================
    component.anadirPlanta('potus');

    const req = httpMock.expectOne('http://localhost:3000/api/registrar-planta');

    expect(req.request.method).toBe('POST');
    // Fluent assertion: valida que se intentó registrar la planta

    req.flush('error al registrar', {
      status: 500,
      statusText: 'Internal Server Error'
    });

    // ===================== ASSERT ======================
    expect(errorSpy).toHaveBeenCalled();
    // Fluent assertion: valida que el error fue registrado en consola

    expect(alertSpy).toHaveBeenCalledWith('No se pudo añadir la planta');
    // Fluent assertion: valida que se informa al usuario el error del registro

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });

  it('HU10F P8 - Debe usar el ID_USUARIO almacenado en localStorage al construir el body del registro', () => {
    // ===================== ARRANGE =====================
    localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 99 }));
    (component as any).plantaIds['lengua-de-suegra'] = 7;

    // ======================= ACT =======================
    component.anadirPlanta('lengua-de-suegra');

    const req = httpMock.expectOne('http://localhost:3000/api/registrar-planta');

    // ===================== ASSERT ======================
    expect(req.request.body).toEqual(
      jasmine.objectContaining({
        id_usuario: 99,
        id_planta: 7
      })
    );
    // Fluent assertion: valida que se usa el ID_USUARIO almacenado en localStorage

    req.flush({ message: 'Registro exitoso' });

    // FIRST: prueba rápida, independiente, repetible y self-validating
  });
});