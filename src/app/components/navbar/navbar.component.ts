import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  showSettingsMenu = false;
  
  // Estados de expansión de secciones
  expandedSections: { [key: string]: boolean } = {
    gestion: false,
    finanzas: false,
    administracion: false
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Suscribirse a los cambios del usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.settings-menu')) {
        this.showSettingsMenu = false;
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  getDoctorFullName(): string {
    if (this.currentUser?.nombres && this.currentUser?.apellidos) {
      return `${this.currentUser.nombres} ${this.currentUser.apellidos}`;
    }
    // Si no hay nombres, usar el username pero formateado
    if (this.currentUser?.username) {
      return this.currentUser.username.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Usuario';
  }

  toggleSettingsMenu() {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  closeSettingsMenu() {
    this.showSettingsMenu = false;
  }

  toggleSubmenu(section: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.expandedSections[section] = !this.expandedSections[section];
  }

  isExpanded(section: string): boolean {
    return this.expandedSections[section] || false;
  }
}