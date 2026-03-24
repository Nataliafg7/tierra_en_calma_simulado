import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { App } from './app';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

describe('App Component', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { params: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct initial title', () => {
    expect((component as any).title).toEqual('Tierra en calma');
  });

  it('should call Swal.fire and reset contacto on enviarFormulario()', () => {
    const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve() as any);
    component.contacto = { nombre: 'Test', correo: 'test@a.com', mensaje: 'Hola' };

    component.enviarFormulario();

    expect(swalSpy).toHaveBeenCalled();
    expect(component.contacto.nombre).toBe('');
    expect(component.contacto.correo).toBe('');
    expect(component.contacto.mensaje).toBe('');
  });

  describe('irAContacto', () => {
    it('should navigate to home and scroll to footer when element exists', fakeAsync(() => {
      const mockElement = document.createElement('div');
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(mockElement, 'scrollIntoView');

      component.irAContacto();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);

      tick();       // resolve promise
      tick(200);    // trigger setTimeout

      expect(document.getElementById).toHaveBeenCalledWith('footer');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    }));

    it('should navigate to home but not scroll when footer element is null', fakeAsync(() => {
      spyOn(document, 'getElementById').and.returnValue(null);

      component.irAContacto();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);

      tick();
      tick(200);

      expect(document.getElementById).toHaveBeenCalledWith('footer');
      // No scrollIntoView call expected — element was null
    }));
  });
});
