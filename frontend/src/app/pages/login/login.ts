import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  isContainerActive = false;
  isTransitioning = false;
  isForgotPasswordModalOpen = false;

  loginCorreo = '';
  loginContrasena = '';

  regIdUsuario = '';
  regNombre = '';
  regApellido = '';
  regTelefono = '';
  regCorreo = '';
  regContrasena = '';

  forgotIdentification = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    const openByData = this.route.snapshot.data?.['openRegister'] === true;

    const sub = this.route.queryParams.subscribe((p) => {
      const openByQuery = p['modo'] === 'registro';

      if (openByData || openByQuery) {
        this.inicializarVistaRegistro();
      } else {
        this.inicializarVistaLogin();
      }

      sub.unsubscribe();
    });

    const state = history.state as { abrirRegistro?: boolean } | undefined;

    if (state?.abrirRegistro) {
      this.inicializarVistaRegistro();
    }
  }

  /* istanbul ignore next */
  private inicializarVistaRegistro(): void {
    this.isContainerActive = true;
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  /* istanbul ignore next */
  private inicializarVistaLogin(): void {
    this.isContainerActive = false;
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  /* istanbul ignore next */
  showRegister(): void {
    this.isTransitioning = true;
    setTimeout(() => {
      this.isContainerActive = true;
      this.isTransitioning = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  }

  /* istanbul ignore next */
  showLogin(): void {
    this.isTransitioning = true;
    setTimeout(() => {
      this.isContainerActive = false;
      this.isTransitioning = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  }

  /* istanbul ignore next */
  openForgotPasswordModal(event: Event): void {
    event.preventDefault();
    this.isForgotPasswordModalOpen = true;
  }

  /* istanbul ignore next */
  closeForgotPasswordModal(): void {
    this.isForgotPasswordModalOpen = false;
    this.forgotIdentification = '';
  }

  /* istanbul ignore next */
  sendPasswordReset(): void {
    if (!this.forgotIdentification.trim()) {
      alert('Por favor ingresa tu correo electrónico.');
      return;
    }

    const correo = this.forgotIdentification.trim();

    this.authService.recuperarContrasena(correo).subscribe({
      next: () => {
        alert('Hemos enviado un correo con instrucciones para restablecer tu contraseña.');
        this.closeForgotPasswordModal();
      },
      error: (err: any) => {
        console.error('Error al recuperar contraseña:', err);
        alert('No se pudo enviar el correo. Intenta más tarde.');
      }
    });
  }

  onLoginSubmit(event: Event): void {
    event.preventDefault();

    const credentials = {
      correo_electronico: this.loginCorreo.trim(),
      contrasena: this.loginContrasena.trim()
    };

    if (!credentials.correo_electronico || !credentials.contrasena) {
      alert('Ingresa tu correo y contraseña.');
      return;
    }

    this.authService.login(credentials).subscribe({
      next: (res: any) => {
        const usuario = Array.isArray(res.user) ? res.user[0] : res.user;

        if (usuario && (usuario.NOMBRE || usuario.nombre)) {
          localStorage.setItem('usuario', JSON.stringify(usuario));
          alert(`Bienvenid@ ${usuario.NOMBRE || usuario.nombre}`);

          const correo = usuario.CORREO_ELECTRONICO || usuario.correo_electronico;
          if (correo === 'admin@tierraencalma.com') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/mis-plantas']);
          }
        } else {
          alert('Credenciales inválidas. Verifica tu correo o contraseña.');
        }
      },
      error: (err) => {
        if (err.status === 0) {
          alert('No se pudo conectar con el servidor. Verifica el backend.');
        } else if (err.error?.message) {
          alert(`${err.error.message}`);
        } else {
          alert('Credenciales inválidas.');
        }
      }
    });
  }

  onRegisterSubmit(event: Event): void {
    event.preventDefault();

    const newUser = {
      id_usuario: this.regIdUsuario.trim(),
      nombre: this.regNombre.trim(),
      apellido: this.regApellido.trim(),
      telefono: this.regTelefono.trim(),
      correo_electronico: this.regCorreo.trim(),
      contrasena: this.regContrasena.trim()
    };

    if (!newUser.id_usuario || !newUser.nombre || !newUser.correo_electronico || !newUser.contrasena) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    this.authService.register(newUser).subscribe({
      next: () => {
        alert('Usuario registrado con éxito.');
        this.showLogin();
      },
      error: () => {
        alert('No se pudo registrar el usuario. Revisa los datos o intenta más tarde.');
      }
    });
  }
}