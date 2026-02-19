import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { HeaderPrivadoComponent } from '../pages/header-privado/header-privado';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, HeaderPrivadoComponent],
  templateUrl: './private-layout.html',
  styleUrls: ['../app.scss']
})
export class PrivateLayoutComponent {
  onSubmit() {
    alert('📩 Tu mensaje fue enviado correctamente.');
  }
}
