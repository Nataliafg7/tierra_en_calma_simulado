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

  it('P3 – Debe manejar correctamente una respuesta exitosa con lista vacía', () => {

    spyOn(console, 'log');

    fixture.detectChanges();

    const req = httpMock.expectOne(`${API_URL}/plantas`);
    expect(req.request.method).toBe('GET');

    // simulamos respuesta exitosa sin datos
    req.flush([]);

    expect(console.log).toHaveBeenCalledWith(
      "Mapa de plantas cargado:",
      {}
    );

    expect(component).toBeTruthy();
  });

});