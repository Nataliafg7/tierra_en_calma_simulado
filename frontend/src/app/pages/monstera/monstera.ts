import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { MqttDataService } from '../../services/mqtt-data.service';
Chart.register(...registerables);

interface RiegoHistorial {
  tipo: 'manual' | 'automático';
  mensaje: string;
  hora: string;
}

@Component({
  selector: 'app-monstera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monstera.html',
  styleUrls: ['./monstera.scss']
})
export class MonsteraComponent implements OnInit, OnDestroy, AfterViewInit {
// SONAR-IGNORE-START
  // UI
  isConnected = false;
  realtimeData = 'Cargando...';
  lastUpdate = 'Última actualización: --:--:--';

  // Historial
  historialRiego: RiegoHistorial[] = [];
  historial: string[] = [];

  // Cuidados
  nuevoCuidado = { fecha: '', tipo_cuidado: '', detalles: '' };

// SONAR-IGNORE-END
  // Datos sensor
  sensorData = { temperatura: '---', humedadSuelo: '---' };

// SONAR-IGNORE-START
  // Chart
  @ViewChild('soilChart', { static: false }) soilChartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  private maxDataPoints = 20;
  private humidityData: number[] = [];
  private tempData: number[] = [];

  // Polling
  private pollHandle?: any;

  // Planta activa
  private idPlantaUsuario: number | null = null;

  constructor(
    private mqttService: MqttDataService,
    private route: ActivatedRoute
  ) { }

// SONAR-IGNORE-END
  ngOnInit(): void {
    const qp = Number(this.route.snapshot.queryParamMap.get('pu'));
    if (Number.isInteger(qp)) {
      this.idPlantaUsuario = qp;
      localStorage.setItem('planta_usuario_id', String(qp)); 
    } else {
      // 2) fallback a localStorage
      this.idPlantaUsuario = this.leerPlantaUsuarioId();
    }

    if (!Number.isInteger(this.idPlantaUsuario as any)) {
      alert('No hay planta seleccionada para monitoreo.');
      return;
    }

    this.pollHandle = setInterval(() => this.cargarDatos(), 2000);
    this.cargarDatos();
  }
// SONAR-IGNORE-START

  ngAfterViewInit(): void { this.ensureChart(); }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
    if (this.chart) this.chart.destroy();
  }

  //  helpers 
  private leerPlantaUsuarioId(): number | null {
    const raw = localStorage.getItem('planta_usuario_id');
    const n = raw ? Number(raw) : Number.NaN;
    return Number.isInteger(n) ? n : null;
  }

  //  riego 
  activarRiego(): void {
    this.mqttService.activarRiego().subscribe({
      next: () => {
        this.agregarHistorial('manual', 'Riego manual activado');
        alert('Riego activado correctamente');
      },
      error: (err) => {
        console.error('Error al activar el riego:', err);
        alert('Error al activar el riego');
      }
    });
  }
// SONAR-IGNORE-END
  verificarCondiciones(): void {
    if (!this.idPlantaUsuario) return alert('Falta ID de planta');
    fetch('http://localhost:3000/api/verificar-condiciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_planta_usuario: this.idPlantaUsuario })
    })
    .then(r => r.json())
    .then(result => {
      alert(result.mensaje || 'Verificación completada');
    })
    .catch(err => {
      console.error('[VERIFICAR_CONDICIONES] error', err);
      alert('Error al verificar las condiciones');
    });
  }
// SONAR-IGNORE-START

  private activarRiegoAutomatico(): void {
    this.agregarHistorial('automático', 'Riego automático ejecutado');
  }

  private agregarHistorial(tipo: 'manual' | 'automático', mensaje: string): void {
    this.historialRiego.unshift({ tipo, mensaje, hora: new Date().toLocaleTimeString() });
    if (this.historialRiego.length > 10) this.historialRiego.pop();
  }

// SONAR-IGNORE-END
  //  datos backend 
  private cargarDatos(): void {
    this.mqttService.getUltimoDato().subscribe(res => {
      if (!res || !res.dato) return;

      this.realtimeData = res.dato;
      this.lastUpdate = `Última actualización: ${new Date().toLocaleTimeString()}`;
      this.isConnected = true;

      // parseo: T:xx.x, H:yy.y, Suelo:zz.z%
      const tempMatch = res.dato.match(/T[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
      const sueloMatch = res.dato.match(/H[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);

      this.sensorData = {
        temperatura: tempMatch ? `${tempMatch[1]} °C` : '---',
        humedadSuelo: sueloMatch ? `${sueloMatch[1]}%` : '---'
      };

      if (tempMatch) this.pushPoint('temp', Number.parseFloat(tempMatch[1]));
      if (sueloMatch) {
        const h = Number.parseFloat(sueloMatch[1]);
        this.pushPoint('humidity', h);
        if (!Number.isNaN(h) && h < 30) this.activarRiegoAutomatico();
      }
    });

    this.mqttService.getHistorial().subscribe(res => {
      if (res && res.historial) this.historial = res.historial;
    });
  }
// SONAR-IGNORE-START

  //  chart 
  private ensureChart(): void {
    if (this.chart || !this.soilChartRef) return;
    const ctx = this.soilChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: new Array(this.maxDataPoints).fill(''),
        datasets: [
          {
            label: 'Humedad (%)',
            data: this.humidityData,
            borderColor: 'rgba(121, 157, 204, 0.3)',
            backgroundColor: 'rgba(28, 28, 158, 0.2)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: 'Temperatura (°C)',
            data: this.tempData,
            borderColor: 'rgba(110, 93, 63, 0.4)',
            backgroundColor: 'rgba(116, 111, 102, 0.2)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 80 }, x: { display: false } }
      }
    });
  }

  private pushPoint(type: 'humidity' | 'temp', value: number): void {
    if (type === 'humidity') {
      this.humidityData.push(value);
      if (this.humidityData.length > this.maxDataPoints) this.humidityData.shift();
    } else {
      this.tempData.push(value);
      if (this.tempData.length > this.maxDataPoints) this.tempData.shift();
    }
    this.ensureChart();
    if (this.chart) {
      this.chart.data.datasets[0].data = [...this.humidityData];
      this.chart.data.datasets[1].data = [...this.tempData];
      this.chart.update('none');
    }
  }

  //  cuidados 
  guardarCuidado(): void {
    // lee/normaliza ID por si se perdió el contexto
    let idPU = this.idPlantaUsuario;
    if (!Number.isInteger(idPU as any)) {
      const raw = localStorage.getItem('planta_usuario_id');
      idPU = raw ? Number(raw) : null;
    }

    const { fecha, tipo_cuidado, detalles } = this.nuevoCuidado;

    // normaliza fecha a YYYY-MM-DD
    const fechaISO =
      fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
        ? fecha
        : (fecha ? new Date(fecha).toISOString().slice(0, 10) : '');

    const tipoTrim = (tipo_cuidado || '').trim();

    // validaciones front
    if (!Number.isInteger(idPU as any)) {
      alert('Falta id_planta_usuario');
      console.warn('[CUIDADO] id_planta_usuario inválido:', idPU);
      return;
    }
    if (!fechaISO) {
      alert('Falta fecha (YYYY-MM-DD)');
      console.warn('[CUIDADO] fecha inválida:', fecha);
      return;
    }
    if (!tipoTrim) {
      alert('Falta tipo de cuidado');
      console.warn('[CUIDADO] tipo inválido:', tipo_cuidado);
      return;
    }

    const body = {
      id_planta_usuario: idPU,
      fecha: fechaISO,        
      tipo: tipoTrim,         
      detalles: detalles?.trim() || null,
    };

    console.log('[CUIDADO] POST body verificado →', body);

    fetch('http://localhost:3000/api/cuidados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(() => {
        alert(`Cuidado guardado:\n${tipoTrim} el ${fechaISO}`);
        this.nuevoCuidado = { fecha: '', tipo_cuidado: '', detalles: '' };
      })
      .catch((e) => {
        console.error('[CUIDADO] error', e);
        alert('Error guardando el cuidado');
      });
  }
}
// SONAR-IGNORE-END
