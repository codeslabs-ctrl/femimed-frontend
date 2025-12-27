import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HomePreferencesService } from '../../services/home-preferences.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>Configuración</h1>
        <p class="subtitle">Ajustes del sistema según tu perfil.</p>
      </div>

      <div class="card" *ngIf="currentUser; else noUser">
        <div class="section">
          <div class="section-title">Preferencias</div>

          <a *ngIf="canChooseHome"
             class="item"
             routerLink="/settings/home">
            <div class="item-title">Página principal</div>
            <div class="item-subtitle">Elige a dónde ir al iniciar sesión.</div>
          </a>

          <div *ngIf="!canChooseHome" class="muted">
            No hay preferencias disponibles para tu rol.
          </div>
        </div>
      </div>

      <ng-template #noUser>
        <div class="card">
          <p>No hay usuario autenticado.</p>
          <a class="btn" routerLink="/login">Ir a Login</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 1rem; }
    h1 { margin: 0 0 0.25rem 0; font-size: 1.6rem; }
    .subtitle { margin: 0; color: #64748b; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
    .section-title { font-weight: 700; color: #0f172a; margin-bottom: 0.75rem; }
    .item { display: block; padding: 0.75rem; border-radius: 10px; border: 1px solid #e2e8f0; text-decoration: none; color: inherit; }
    .item:hover { border-color: #cbd5e1; background: #f8fafc; }
    .item-title { font-weight: 700; }
    .item-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.1rem; }
    .muted { color: #64748b; }
    .btn { display: inline-flex; margin-top: 0.75rem; padding: 0.6rem 0.9rem; border-radius: 10px; text-decoration: none; background: var(--gradient-primary-solid); color: #fff; }
  `]
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  canChooseHome = false;

  constructor(
    private authService: AuthService,
    private homePrefs: HomePreferencesService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.canChooseHome = this.homePrefs.canChooseHome(this.currentUser);
  }
}


