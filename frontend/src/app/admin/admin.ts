import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit {
  vistas: any = {
    estado_plantas: [],
    historial_riegos: [],
    alertas_condiciones: [],
    cuidados_programados: []
  };
  cargando = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('http://localhost:3000/api/admin/vistas').subscribe({
      next: (data: any) => {
        console.log('Respuesta recibida:', data); 
        this.vistas.estado_plantas = data.estado_plantas || [];
        this.vistas.historial_riegos = data.historial_riegos || [];
        this.vistas.alertas_condiciones = data.alertas_condiciones || [];
        this.vistas.cuidados_programados = data.cuidados_programados || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener vistas:', err);
        this.cargando = false;
      }
    });
  }
}
