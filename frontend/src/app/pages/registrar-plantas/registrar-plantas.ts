import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:3000/api';

@Component({
  selector: 'app-registrar-plantas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registrar-plantas.html',
  styleUrls: ['./registrar-plantas.scss']
})
export class RegistrarPlantasComponent implements OnInit {

  private plantaIds: { [key: string]: number } = {};

  constructor(private router: Router, private http: HttpClient) {}
  
  ngOnInit(): void {
    this.cargarPlantas();
  }

  cargarPlantas(): void {
      this.http.get<any[]>(`${API_URL}/plantas`).subscribe({
        next: (plantas) => {
          plantas.forEach(p => {
            const key = p.NOMBRE_COMUN
              .toLowerCase()
              .normalize("NFD")              
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, '-')          
              .trim();
            this.plantaIds[key] = p.ID_PLANTA;
          });
          console.log("Mapa de plantas cargado:", this.plantaIds);
        },
        error: (err) => {
          console.error("Error cargando plantas:", err);
          alert("No se pudieron cargar las plantas desde el servidor");
        }
      });
  }


  anadirPlanta(tipoPlanta: string): void {
    const id_planta = this.plantaIds[tipoPlanta];
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const id_usuario = usuario.ID_USUARIO;

    if (!id_usuario) {
      alert("Debes iniciar sesión antes de añadir plantas");
      this.router.navigate(['/login']);
      return;
    }

    if (!id_planta) {
      alert("No se encontró el ID de la planta seleccionada");
      return;
    }

    this.http.post(`${API_URL}/registrar-planta`, {
      id_usuario,
      id_planta
    }).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.router.navigate(['/mis-plantas']);
      },
      error: (err) => {
        console.error("Error al añadir planta:", err);
        alert("No se pudo añadir la planta");
      }
    });
  }
}
