import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = localStorage.getItem('usuario');
    if (user) {
      return true; // ✅ hay usuario logueado → deja entrar
    } else {
      alert('Debes iniciar sesión primero');
      this.router.navigate(['/login']); // 🔄 redirige a login
      return false;
    }
  }
}
