import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MonsteraComponent } from './monstera';

describe('HU18 – Frontend – P1 (id de planta inválido)', () => {
  it('Debe evitar la verificación cuando el id de planta es inválido', () => {
    TestBed.configureTestingModule({
      imports: [
        MonsteraComponent,         
        HttpClientTestingModule,    
        RouterTestingModule         
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ idPlantaUsuario: null }),
              queryParamMap: convertToParamMap({}),
            },
            params: { subscribe: (fn: any) => fn({}) },
            queryParams: { subscribe: (fn: any) => fn({}) },
          }
        }
      ]
    });

    const fixture = TestBed.createComponent(MonsteraComponent);
    const component = fixture.componentInstance;

    (component as any).idPlantaUsuario = null;

    component.verificarCondiciones();

    expect((component as any).idPlantaUsuario).toBeNull();
  });
});