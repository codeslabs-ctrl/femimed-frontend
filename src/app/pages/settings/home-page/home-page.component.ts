import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { HomePreferencesService } from '../../../services/home-preferences.service';

@Component({
  standalone: true,
  selector: 'app-home-page-settings',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  isSaving = false;
  selectedRoute = '';
  options: Array<{ label: string; route: string }> = [];
  message = '';

  constructor(
    private authService: AuthService,
    private homePrefs: HomePreferencesService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.options = this.homePrefs.getAllowedHomesForRole(user?.rol);

    this.homePrefs.getPreferredHomeRoute(user).subscribe(route => {
      this.selectedRoute = route;
    });
  }

  save(): void {
    const user = this.authService.getCurrentUser();
    const allowed = this.homePrefs.getAllowedHomesForRole(user?.rol).map(x => x.route);
    if (!allowed.includes(this.selectedRoute)) {
      this.message = 'Ruta no permitida para tu rol.';
      return;
    }

    this.isSaving = true;
    this.message = '';

    this.homePrefs.setPreferredHomeRoute(this.selectedRoute).subscribe(ok => {
      this.isSaving = false;
      this.message = ok ? 'Preferencia guardada.' : 'No se pudo guardar la preferencia.';
    });
  }
}


