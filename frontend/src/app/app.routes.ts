import { Routes } from '@angular/router';

//  LAYOUTS 
import { PublicLayoutComponent } from './layouts/public-layout';
import { PrivateLayoutComponent } from './layouts/private-layout';

//  PÁGINAS PÚBLICAS 
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { ChatbotComponent } from './pages/chatbot/chatbot';

//  PÁGINAS PRIVADAS 
import { MisPlantasComponent } from './pages/mis-plantas/mis-plantas';
import { RegistrarPlantasComponent } from './pages/registrar-plantas/registrar-plantas';
import { MonsteraComponent } from './pages/monstera/monstera';

//  ADMIN 
import { AdminComponent } from './admin/admin';

export const routes: Routes = [
  //  RUTAS PÚBLICAS 
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'login/registro', component: LoginComponent, data: { openRegister: true } }
    ]
  },

  //  RUTAS PRIVADAS (usuarios logueados) 
  {
    path: '',
    component: PrivateLayoutComponent,
    children: [
      { path: 'mis-plantas', component: MisPlantasComponent },
      { path: 'registrar-plantas', component: RegistrarPlantasComponent },
      { path: 'monstera', component: MonsteraComponent },
      { path: 'admin', component: AdminComponent },
      { path: 'chatbot', component: ChatbotComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];
