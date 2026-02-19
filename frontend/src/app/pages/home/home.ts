import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {
  title = 'Bienvenida a Tierra en calma';
  saludar() {
    alert('¡Hola desde TierraEnCalma!');
  }
}
