import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PublicLayoutComponent } from './public-layout';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { RouterTestingModule } from '@angular/router/testing';

describe('PublicLayoutComponent', () => {
  let component: PublicLayoutComponent;
  let fixture: ComponentFixture<PublicLayoutComponent>;
  let router: Router;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['post']);

    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent, RouterTestingModule],
      providers: [
        { provide: HttpClient, useValue: httpSpy },
        { provide: ActivatedRoute, useValue: { params: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicLayoutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
    spyOn(window, 'alert');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('enviarFormulario', () => {
    it('should show success alert and reset contacto on successful post', () => {
      httpSpy.post.and.returnValue(of({ success: true }));
      component.contacto = { nombre: 'Test', correo: 't@t.com', mensaje: 'msg' };

      component.enviarFormulario();

      expect(httpSpy.post).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Gracias Test, tu mensaje fue enviado correctamente.');
      expect(component.contacto.nombre).toBe('');
    });

    it('should show error alert on post failure', () => {
      httpSpy.post.and.returnValue(throwError(() => new Error('NetError')));
      component.contacto = { nombre: 'Test', correo: 't@t.com', mensaje: 'msg' };

      component.enviarFormulario();

      expect(window.alert).toHaveBeenCalledWith('Hubo un problema al enviar tu mensaje. Intenta nuevamente.');
    });
  });

  describe('irAHome', () => {
    it('should navigate and scroll to top', fakeAsync(() => {
      spyOn(window, 'scrollTo');
      component.irAHome();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      tick(200);
      expect(window.scrollTo as jasmine.Spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' } as any);
    }));
  });

  describe('irAProposito', () => {
    it('should scroll if element exists', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'proposito';
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(mockElement, 'scrollIntoView');

      component.irAProposito();

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should navigate and schedule scroll if element does not Initially exist', fakeAsync(() => {
      spyOn(document, 'getElementById').and.returnValue(null);

      component.irAProposito();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
      tick();   // resolve promise
      tick(300); // trigger setTimeout
    }));
  });

  describe('irAContacto', () => {
    it('should scroll to footer element when it exists', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'footer';
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(mockElement, 'scrollIntoView');

      component.irAContacto();

      expect(document.getElementById).toHaveBeenCalledWith('footer');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should navigate to root and schedule scroll when footer element does not exist', fakeAsync(() => {
      spyOn(document, 'getElementById').and.returnValue(null);

      component.irAContacto();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
      tick();   // resolve promise
      tick(300); // trigger setTimeout
    }));

    it('should scroll the inner footer element after navigation when it eventually exists', fakeAsync(() => {
      let callCount = 0;
      const mockEl = document.createElement('div');
      spyOn(mockEl, 'scrollIntoView');

      // First call returns null (triggers navigation), second call inside timeout returns element
      spyOn(document, 'getElementById').and.callFake(() => {
        callCount++;
        return callCount === 1 ? null : mockEl;
      });

      component.irAContacto();
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      tick();   // resolve promise
      tick(300); // trigger setTimeout

      expect(mockEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    }));
  });
});
