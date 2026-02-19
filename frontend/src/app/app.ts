import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, RouterLink],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = 'Tierra en calma';

  constructor(private router: Router) {}

  contacto = {
    nombre: '',
    correo: '',
    mensaje: ''
  };

  enviarFormulario() {
    Swal.fire({
      title: `¡Gracias, ${this.contacto.nombre}!`,
      text: 'Tu mensaje fue enviado correctamente. Pronto nos pondremos en contacto contigo.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#93511c',
      background: '#fefdfb',
      color: '#2d4a2f',
      iconColor: '#ca9a72',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });

    this.contacto = { nombre: '', correo: '', mensaje: '' };
  }

  irAProposito() {
    this.router.navigate(['/home']).then(() => {
      setTimeout(() => {
        const element = document.getElementById('proposito');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    });
  }

  irAContacto() {
    this.router.navigate(['/home']).then(() => {
      setTimeout(() => {
        const element = document.getElementById('footer');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    });
  }

  irALogin(event: Event, tipo: string) {
    event.preventDefault();
    event.stopPropagation();

    this.router.navigate(['/login']).then(() => {
      localStorage.setItem('tipoForm', tipo);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
