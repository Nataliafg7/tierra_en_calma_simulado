import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../login/auth.service';

type Planta = {
  ID_PLANTA_USUARIO?: number;   // único por planta del usuario
  ID_PLANTA: number;
  NOMBRE_COMUN: string;
  NOMBRE_CIENTIFICO: string;
};

@Component({
  selector: 'app-mis-plantas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-plantas.html',
  styleUrls: ['./mis-plantas.scss']
})
export class MisPlantasComponent implements OnInit {
  @ViewChild('carrusel') carruselRef!: ElementRef<HTMLDivElement>;

  imagenCargada = true;
  nombreUsuario = 'Usuario';
  indiceActual = 0;
  plantas: Planta[] = [];

  page = 1;
  pageSize = 6;
  Math = Math;

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient                     // para /api/monitorear
  ) { }

  ngOnInit(): void {
    const u = safeParse(localStorage.getItem('usuario'));
    const id = u?.id ?? u?.ID_USUARIO;

    this.nombreUsuario = u?.nombre ?? u?.NOMBRE ?? 'Usuario';

    if (!Number.isInteger(id)) {
      alert('Sesión inválida. Inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getMisPlantas(id).subscribe({
      next: (rows: Planta[]) => {
        this.plantas = Array.isArray(rows) ? rows : [];

        this.resetCarrusel();
        this.page = 1;
      },
      error: () => {
        alert('No fue posible cargar tus plantas.');
      }
    });
  }

  private resetCarrusel() {
    this.indiceActual = 0;
    const carrusel = this.carruselRef?.nativeElement;
    if (carrusel) carrusel.style.transform = 'translateX(0px)';
  }

  //  Carrusel 
  siguiente(): void {
    const carrusel = this.carruselRef?.nativeElement;
    if (!carrusel) return;

    const items = carrusel.querySelectorAll('.carrusel-item');
    if (items.length === 0) return;

    const visibles = 3;
    const totalItems = items.length;
    const itemWidth = (items[0] as HTMLElement).clientWidth + 30;

    if (this.indiceActual < totalItems - visibles) {
      this.indiceActual++;
      carrusel.style.transform = `translateX(-${this.indiceActual * itemWidth}px)`;
    }
  }

  anterior(): void {
    const carrusel = this.carruselRef?.nativeElement;
    if (!carrusel) return;

    const items = carrusel.querySelectorAll('.carrusel-item');
    if (items.length === 0) return;

    const itemWidth = (items[0] as HTMLElement).clientWidth + 30;

    if (this.indiceActual > 0) {
      this.indiceActual--;
      carrusel.style.transform = `translateX(-${this.indiceActual * itemWidth}px)`;
    }
  }

  //  Monitorear: asegura sensor y navega 
  monitorear(p: Planta) {
    const idPlantaUsuario = Number(p?.ID_PLANTA_USUARIO);
    console.log('[Monitorear] planta:', p, 'ID_PLANTA_USUARIO=', p?.ID_PLANTA_USUARIO);

    if (!Number.isInteger(idPlantaUsuario) || idPlantaUsuario <= 0) {
      alert('Planta inválida (falta ID_PLANTA_USUARIO)');
      return;
    }

    // 1) guarda en localStorage
    localStorage.setItem('planta_usuario_id', String(idPlantaUsuario));
    const check = Number(localStorage.getItem('planta_usuario_id'));
    if (!Number.isInteger(check) || check !== idPlantaUsuario) {
      console.error('[Monitorear][ERROR] No se pudo persistir planta_usuario_id:', { idPlantaUsuario, check });
      alert('No se pudo preparar el monitoreo (persistencia).');
      return;
    }
    console.log('[Monitorear] persistido planta_usuario_id=', check);

    // 2) prepara backend (crea/selecciona sensor)
    this.http.post('http://localhost:3000/api/monitorear', {
      id_planta_usuario: idPlantaUsuario
    }).subscribe({
      next: (r: any) => {
        console.log('[Monitorear] backend OK, id_sensor=', r?.id_sensor);
        // 4) navega con query param por si el localStorage falla en otra pestaña
        this.router.navigate(['/monstera'], { queryParams: { pu: idPlantaUsuario } });
      },
      error: (e) => {
        console.error('[Monitorear][ERROR] backend', e);
        alert('No se pudo preparar el monitoreo.');
      }
    });
  }

  //  Navegación individual por tipo 
  irACeriman() { this.router.navigate(['/monstera']); }
  irADolar() { console.log('Ir a Dólar'); }
  irALenguaSuegra() { console.log('Ir a Lengua de Suegra'); }
  irAHojaViolin() { console.log('Ir a Hoja de Violín'); }
  irAPotus() { console.log('Ir a Potus'); }
  irAPalmaAreca() { console.log('Ir a Palma Areca'); }

  irPlanta(p: Planta) {
    const n = this.norm(p.NOMBRE_COMUN);
    if (n.includes('monstera') || n.includes('ceriman')) return this.irACeriman();
    if (n.includes('dolar')) return this.irADolar();
    if (n.includes('lengua de suegra') || n.includes('sansevieria')) return this.irALenguaSuegra();
    if (n.includes('hoja de violin') || n.includes('ficus lyrata')) return this.irAHojaViolin();
    if (n.includes('potus') || n.includes('epipremnum')) return this.irAPotus();
    if (n.includes('palma areca') || n.includes('dypsis')) return this.irAPalmaAreca();
    console.log('Tipo no mapeado:', p);
  }

  //  Mapeo dinámico de estilos y textos 
  plantClass(p: Planta): string {
    const n = this.norm(p.NOMBRE_COMUN);
    if (n.includes('monstera') || n.includes('ceriman')) return 'ceriman-card';
    if (n.includes('dolar')) return 'dolar-card';
    if (n.includes('lengua de suegra') || n.includes('sansevieria')) return 'lengua-suegra-card';
    if (n.includes('hoja de violin') || n.includes('ficus lyrata')) return 'hoja-violin-card';
    if (n.includes('potus') || n.includes('epipremnum')) return 'potus-card';
    if (n.includes('palma areca') || n.includes('dypsis')) return 'palma-areca-card';
    return 'ceriman-card';
  }

  desc(p: Planta): string {
    const n = this.norm(p.NOMBRE_COMUN);
    if (n.includes('monstera') || n.includes('ceriman'))
      return 'Esta planta llena tus espacios de vida tropical<br>y frescura. Sus hojas gigantes te regalarán<br>calma y vitalidad cada día.';
    if (n.includes('dolar'))
      return 'Considerada símbolo de prosperidad<br> y abundancia, atrae energía positiva.';
    if (n.includes('lengua de suegra') || n.includes('sansevieria'))
      return 'Fuerte, resistente y purificadora. Ideal para<br>quienes buscan una planta que les recuerde<br>que incluso en la adversidad se puede florecer.';
    if (n.includes('hoja de violin') || n.includes('ficus lyrata'))
      return 'Su porte elegante y hojas en forma de violín<br>transforman cualquier rincón en un lugar acogedor.';
    if (n.includes('potus') || n.includes('epipremnum'))
      return 'Crece sin pedir mucho a cambio. Purifica el aire<br>y te recuerda que la belleza está en la sencillez.';
    if (n.includes('palma areca') || n.includes('dypsis'))
      return 'Sus hojas finas y verdes evocan brisas de<br>playa y bienestar. Perfecta para traer<br>frescura a tu hogar.';
    return '';
  }

  private norm(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  registrarNuevaPlanta() {
    this.router.navigate(['/registrar-plantas']);
  }
}

function safeParse(v: string | null): any | null {
  try { return v ? JSON.parse(v) : null; } catch { return null; }
}
