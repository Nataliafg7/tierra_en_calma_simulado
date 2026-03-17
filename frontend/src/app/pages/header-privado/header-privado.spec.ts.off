import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-privado',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './header-privado.html',
  styleUrls: ['./header-privado.scss']
})
export class HeaderPrivadoComponent {
  nombreUsuario: string = '';

  constructor(private router: Router) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.nombreUsuario = usuario.NOMBRE || 'Usuario';
  }

  cerrarSesion() {
    localStorage.removeItem('usuario');
    alert('👋 Hasta pronto, vuelve pronto a cuidar tus plantas.');
    this.router.navigate(['/']);
  }
}
