import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  /* Registro de usuario */
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  /* Inicio de sesión */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  /* Recuperar contraseña */
  recuperarContrasena(correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar-contrasena`, { correo });
  }

  /* Mis plantas */
  getMisPlantas(idUsuario: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-plantas`, {
      headers: { 'x-user-id': String(idUsuario) }
    });
  }
}