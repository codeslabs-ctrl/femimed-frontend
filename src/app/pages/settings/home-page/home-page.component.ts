import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { HomeOption, HomePreferencesService, HomeRoute } from '../../../services/home-preferences.service';

@Component({
  selector: 'app-home-page-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>Página principal</h1>
        <p class="subtitle">
          Selecciona a dónde quieres ir al iniciar sesión.
        </p>
      </div>

      <div class="card" *ngIf="currentUser; else noUser">
        <div *ngIf="!canChoose; else chooser" class="readonly">
          <p>
            Tu rol (<strong>{{ currentUser.rol }}</strong>) solo tiene acceso a una sección.
            Tu página principal está definida automáticamente.
          </p>
          <div class="actions">
            <a class="btn btn-primary" [routerLink]="resolvedRoute">Ir a mi página principal</a>
          </div>
        </div>

        <ng-template #chooser>
          <label class="label" for="homeRoute">Mi página principal</label>
          <select id="homeRoute" class="select" [(ngModel)]="selectedRoute" name="homeRoute">
            <option *ngFor="let opt of options" [ngValue]="opt.route">{{ opt.label }}</option>
          </select>

          <div class="actions">
            <button class="btn btn-primary" type="button" (click)="save()" [disabled]="!selectedRoute">
              Guardar
            </button>
            <button class="btn btn-secondary" type="button" (click)="goBack()">
              Volver
            </button>
          </div>
        </ng-template>
      </div>

      <ng-template #noUser>
        <div class="card">
          <p>No hay usuario autenticado.</p>
          <div class="actions">
            <a class="btn btn-primary" routerLink="/login">Ir a Login</a>
          </div>
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
    .label { display: block; font-weight: 600; margin: 0 0 0.5rem 0; color: #334155; }
    .select { width: 100%; max-width: 420px; padding: 0.6rem 0.75rem; border-radius: 10px; border: 1px solid #cbd5e1; }
    .actions { margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .btn { border: 0; border-radius: 10px; padding: 0.6rem 0.9rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-primary { background: var(--gradient-primary-solid); color: white; }
    .btn-secondary { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
    .readonly { color: #334155; }
  `]
})
export class HomePageComponent implements OnInit {
  currentUser = this.authService.getCurrentUser();
  options: HomeOption[] = [];
  canChoose = false;
  selectedRoute: HomeRoute | null = null;
  resolvedRoute: HomeRoute = '/dashboard';

  constructor(
    private authService: AuthService,
    private homePrefs: HomePreferencesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.options = this.homePrefs.getAllowedHomeOptions(this.currentUser);
    this.canChoose = this.homePrefs.canChooseHome(this.currentUser);
    this.resolvedRoute = this.homePrefs.resolveHomeRoute(this.currentUser);
    this.selectedRoute = this.homePrefs.getPreferredHomeRoute(this.currentUser) || this.resolvedRoute;
  }

  save(): void {
    if (!this.currentUser || !this.selectedRoute) return;
    this.homePrefs.saveHomeRouteToServer(this.currentUser, this.selectedRoute).subscribe((ok) => {
      if (ok) {
        alert('✅ Preferencia guardada');
        this.router.navigate([this.selectedRoute as any]);
      } else {
        alert('❌ No se pudo guardar la preferencia. Intenta de nuevo.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}


