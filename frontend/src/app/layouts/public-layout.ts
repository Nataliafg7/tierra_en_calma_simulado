import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './public-layout.html',
  styleUrls: ['./public-layout.scss']
})
export class PublicLayoutComponent {
  contacto = { nombre: '', correo: '', mensaje: '' };

  constructor(private router: Router, private http: HttpClient) {}

  enviarFormulario() {
    const url = 'http://localhost:3000/api/contacto';

    this.http.post(url, this.contacto).subscribe({
      next: (res: any) => {
        alert(`Gracias ${this.contacto.nombre}, tu mensaje fue enviado correctamente.`);
        this.contacto = { nombre: '', correo: '', mensaje: '' };
      },
      error: (err) => {
        console.error('Error al enviar el formulario:', err);
        alert('Hubo un problema al enviar tu mensaje. Intenta nuevamente.');
      }
    });
  }

  irAHome() {
    this.router.navigate(['/']);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
  }

  irAProposito() {
    const element = document.getElementById('proposito');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/']).then(() =>
        setTimeout(() => {
          const el = document.getElementById('proposito');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300)
      );
    }
  }

  irAContacto() {
    const element = document.getElementById('footer');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/']).then(() =>
        setTimeout(() => {
          const el = document.getElementById('footer');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300)
      );
    }
  }
}
