import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPrivadoComponent } from '../header-privado/header-privado';
import { FormsModule } from '@angular/forms'; 
import { FAQS } from './faq'; 


@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, HeaderPrivadoComponent, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss']
})
export class ChatbotComponent {
  @ViewChild('carrusel') carrusel!: ElementRef<HTMLDivElement>;


  meses = [
    { nombre: 'Enero', clase: 'enero', fases: ['🌒 6 Ene — Creciente', '🌕 13 Ene — Llena', '🌗 21 Ene — Menguante', '🌑 29 Ene — Nueva'] },
    { nombre: 'Febrero', clase: 'febrero', fases: ['🌒 5 Feb — Creciente', '🌕 12 Feb — Llena', '🌗 20 Feb — Menguante', '🌑 27 Feb — Nueva'] },
    { nombre: 'Marzo', clase: 'marzo', fases: ['🌒 6 Mar — Creciente', '🌕 14 Mar — Llena', '🌗 22 Mar — Menguante', '🌑 29 Mar — Nueva'] },
    { nombre: 'Abril', clase: 'abril', fases: ['🌒 4 Abr — Creciente', '🌕 12 Abr — Llena', '🌗 20 Abr — Menguante', '🌑 27 Abr — Nueva'] },
    { nombre: 'Mayo', clase: 'mayo', fases: ['🌒 4 May — Creciente', '🌕 12 May — Llena', '🌗 20 May — Menguante', '🌑 26 May — Nueva'] },
    { nombre: 'Junio', clase: 'junio', fases: ['🌒 2 Jun — Creciente', '🌕 11 Jun — Llena', '🌗 18 Jun — Menguante', '🌑 25 Jun — Nueva'] },
    { nombre: 'Julio', clase: 'julio', fases: ['🌒 2 Jul — Creciente', '🌕 10 Jul — Llena', '🌗 17 Jul — Menguante', '🌑 24 Jul — Nueva', '🌒 31 Jul — Creciente'] },
    { nombre: 'Agosto', clase: 'agosto', fases: ['🌒 1 Ago — Creciente', '🌕 9 Ago — Llena', '🌗 16 Ago — Menguante', '🌑 23 Ago — Nueva', '🌒 31 Ago — Creciente'] },
    { nombre: 'Septiembre', clase: 'septiembre', fases: ['🌕 7 Sep — Llena', '🌗 14 Sep — Menguante', '🌑 21 Sep — Nueva', '🌒 29 Sep — Creciente'] },
    { nombre: 'Octubre', clase: 'octubre', fases: ['🌕 6 Oct — Llena', '🌗 13 Oct — Menguante', '🌑 21 Oct — Nueva', '🌒 29 Oct — Creciente'] },
    { nombre: 'Noviembre', clase: 'noviembre', fases: ['🌕 5 Nov — Llena', '🌗 12 Nov — Menguante', '🌑 20 Nov — Nueva', '🌒 28 Nov — Creciente'] },
    { nombre: 'Diciembre', clase: 'diciembre', fases: ['🌕 4 Dic — Llena', '🌗 11 Dic — Menguante', '🌑 19 Dic — Nueva', '🌒 27 Dic — Creciente'] }
  ];

  moverCarrusel(direccion: 'izquierda' | 'derecha') {
    const scroll = this.carrusel.nativeElement;
    const tarjetaAncho = 320; 
    const desplazamiento = direccion === 'derecha' ? tarjetaAncho * 1.2 : -tarjetaAncho * 1.2;
    scroll.scrollBy({ left: desplazamiento, behavior: 'smooth' });
  }

  // Lógica del chat flotante 
  chatAbierto = false;
  mensaje = '';
  mensajes: { autor: string, texto: string }[] = [];

  categorias = FAQS;
  categoriaSeleccionada: any = null;
  preguntaSeleccionada: any = null;

  abrirChat() {
    this.chatAbierto = true;
    if (this.mensajes.length === 0) {
      this.mensajes.push({ autor: 'bot', texto: '🌷 ¡Hola! Soy tu asistente de jardinería.' });
      this.mensajes.push({ autor: 'bot', texto: 'Selecciona una categoría para empezar:' });
    }
  }

  cerrarChat() {
    this.chatAbierto = false;
    this.categoriaSeleccionada = null;
    this.preguntaSeleccionada = null;
  }

    seleccionarCategoria(cat: any) {
    this.categoriaSeleccionada = cat;
    this.mensajes.push({ autor: 'bot', texto: `Has seleccionado: ${cat.categoria}. Ahora elige una pregunta:` });
  }

  seleccionarPregunta(pregunta: any) {
    this.preguntaSeleccionada = pregunta;
    this.mensajes.push({ autor: 'usuario', texto: pregunta.texto });

    setTimeout(() => {
      this.mensajes.push({ autor: 'bot', texto: pregunta.respuesta });

      this.mensajes.push({
        autor: 'bot',
        texto: '¿Quieres volver al menú?',
      });
    }, 600);
  }

  // volver al menú de preguntas
  volverAPreguntas() {
    this.preguntaSeleccionada = null;
    this.mensajes.push({
      autor: 'bot',
      texto: `🌿 Has vuelto a la categoría "${this.categoriaSeleccionada.categoria}". Elige otra pregunta:`
    });
  }

  //volver al menú principal de categorías
  volverACategorias() {
    this.categoriaSeleccionada = null;
    this.preguntaSeleccionada = null;
    this.mensajes.push({
      autor: 'bot',
      texto: '🌱 Has vuelto al menú principal. Elige una categoría:'
    });
  }
}