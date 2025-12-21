import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ChangePasswordModalComponent } from './components/change-password-modal/change-password-modal.component';
import { SnackbarComponent } from './components/snackbar/snackbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, ChangePasswordModalComponent, SnackbarComponent],
  template: `
    <div class="app-container">
      <app-navbar *ngIf="showNavbar"></app-navbar>
      <main class="app-main" [class.full-height]="!showNavbar">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Modal de cambio de contraseña -->
      <app-change-password-modal
        [isVisible]="showPasswordModal"
        [isFirstLogin]="isFirstLogin"
        (close)="closePasswordModal()"
        (passwordChanged)="onPasswordChanged()">
      </app-change-password-modal>
      
      <!-- Snackbar global -->
      <app-snackbar></app-snackbar>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-main {
      flex: 1;
      padding: 1rem;
    }

    .app-main.full-height {
      height: 100vh;
      padding: 0;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'femimed-dashboard';
  showNavbar = false;
  showPasswordModal = false;
  isFirstLogin = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar si mostrar navbar basado en la ruta actual
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateNavbarVisibility((event as NavigationEnd).url);
      });

    // Verificar ruta inicial
    this.updateNavbarVisibility(this.router.url);

    // Suscribirse a cambios en el usuario autenticado
    this.authService.currentUser$.subscribe(user => {
      if (user && this.authService.needsPasswordChange()) {
        this.isFirstLogin = user.first_login === true;
        this.showPasswordModal = true;
      }
    });
  }

  private updateNavbarVisibility(url: string) {
    // No mostrar navbar en la página de login
    this.showNavbar = url !== '/login' && this.authService.isAuthenticated();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  onPasswordChanged(): void {
    this.showPasswordModal = false;
    
    // Actualizar el estado del usuario localmente
    this.authService.updateUserAfterPasswordChange();
  }

}
