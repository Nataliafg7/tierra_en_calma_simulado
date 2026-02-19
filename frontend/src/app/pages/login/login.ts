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
  // Estado de paneles
  isContainerActive = false;   // true muestra registro
  isTransitioning = false;
  isForgotPasswordModalOpen = false;

  // Login
  loginCorreo = '';
  loginContrasena = '';

  // Registro
  regIdUsuario = '';
  regNombre = '';
  regApellido = '';
  regTelefono = '';
  regCorreo = '';
  regContrasena = '';

  // Recuperación
  forgotIdentification = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // 1) Abrir registro si esta ruta lo indica (login/registro)
    const openByData = this.route.snapshot.data?.['openRegister'] === true;

    // 2) Abrir registro si viene con query param (por compatibilidad)
    const sub = this.route.queryParams.subscribe((p) => {
      const openByQuery = p['modo'] === 'registro';
      this.inicializarVista(openByData || openByQuery);
      sub.unsubscribe();
    });

    // 3) Abrir registro si llegó con state (por compatibilidad)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { abrirRegistro?: boolean } | undefined;
    if (state?.abrirRegistro) {
      this.inicializarVista(true);
    }
  }

  private inicializarVista(abrirRegistro: boolean) {
    if (abrirRegistro) {
      // Mostrar registro 
      this.isContainerActive = true;
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } else {
      // Vista login por defecto
      this.isContainerActive = false;
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }

  showRegister(): void {
    this.isTransitioning = true;
    setTimeout(() => {
      this.isContainerActive = true;
      this.isTransitioning = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  }

  showLogin(): void {
    this.isTransitioning = true;
    setTimeout(() => {
      this.isContainerActive = false;
      this.isTransitioning = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  }

  // Modal recuperar contraseña
  openForgotPasswordModal(event: Event): void {
    event.preventDefault();
    this.isForgotPasswordModalOpen = true;
  }
  closeForgotPasswordModal(): void {
    this.isForgotPasswordModalOpen = false;
    this.forgotIdentification = '';
  }
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

  //  LOGIN 
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

          // Validar si es el usuario administrador
          const correo = usuario.CORREO_ELECTRONICO || usuario.correo_electronico;
          if (correo === 'admin@tierraencalma.com') {
            this.router.navigate(['/admin']);   // Panel de vistas del administrador
          } else {
            this.router.navigate(['/mis-plantas']); // Usuario normal
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

  //  REGISTRO 
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
