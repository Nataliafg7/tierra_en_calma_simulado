import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

describe('HU3 Frontend - LoginComponent - P3 (Login usuario normal exitoso)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'mis-plantas', component: DummyComponent },
      { path: 'admin', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientModule, RouterTestingModule.withRoutes(routes)],
      providers: [
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },


            queryParams: {
              subscribe: (fn: any) => {
                const subscription = { unsubscribe: () => {} };
                setTimeout(() => fn({}), 0);
                return subscription;
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('P3: debe guardar usuario, mostrar bienvenida y navegar a /mis-plantas cuando NO es admin', (done) => {

    component.loginCorreo = 'juliana@gmail.com';
    component.loginContrasena = 'juliana';

    const originalAlert = window.alert;
    let alertCapturado = '';
    window.alert = (msg: any) => { alertCapturado = String(msg); };

    const fakeEvent = { preventDefault: () => {} } as unknown as Event;

    component.onLoginSubmit(fakeEvent);
    fixture.detectChanges();

    setTimeout(() => {
      try {
        const raw = localStorage.getItem('usuario');
        expect(raw).not.toBeNull();

        const usuario = raw ? JSON.parse(raw) : null;
        expect(usuario).toBeTruthy();

        expect(alertCapturado.startsWith('Bienvenid@ ')).toBeTrue();
        expect(router.url).toBe('/mis-plantas');
      } finally {
        window.alert = originalAlert;
        done();
      }
    }, 800);
  });
});