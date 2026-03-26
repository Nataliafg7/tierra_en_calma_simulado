import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from '../login';
import { AuthService } from '../auth.service';

@Component({ template: '<p>Dummy</p>' })
class DummyComponent {}

class AuthServiceErrorStub {
  login() {
    return {
      subscribe: ({ error }: any) => {
        error({ status: 500, error: { message: 'Error backend' } });
      }
    };
  }
  register() { return of({}); }
  recuperarContrasena() { return of({}); }
}

describe('HU3 Frontend - LoginComponent - P10', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'admin', component: DummyComponent },
      { path: 'mis-plantas', component: DummyComponent }
    ];

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes(routes)],
      providers: [
        { provide: AuthService, useClass: AuthServiceErrorStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            queryParams: of({})
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

  it('HU3F_P10 - Debe mostrar error del backend', () => {
    // ===================== ARRANGE =====================
    component.loginCorreo = 'test@gmail.com';
    component.loginContrasena = '1234';

    const alertSpy = spyOn(window, 'alert');

    let preventDefaultEjecutado = false;
    const event = {
      preventDefault: () => preventDefaultEjecutado = true
    } as unknown as Event;

    // ======================= ACT =======================
    component.onLoginSubmit(event);

    // ===================== ASSERT ======================
    expect(preventDefaultEjecutado).toBeTrue();
    expect(alertSpy).toHaveBeenCalledWith('Error backend');
  });
});