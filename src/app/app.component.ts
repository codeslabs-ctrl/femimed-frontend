import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ChangePasswordModalComponent } from './components/change-password-modal/change-password-modal.component';
import { SnackbarComponent } from './components/snackbar/snackbar.component';
import { AlertModalComponent } from './components/alert-modal/alert-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, ChangePasswordModalComponent, SnackbarComponent, AlertModalComponent],
  template: `
    <div class="app-container" [class.app-container--chat-view]="showNavbar && isChatRoute">
      <app-navbar *ngIf="showNavbar"></app-navbar>
      <main
        class="app-main"
        [class.full-height]="!showNavbar"
        [class.app-main--chat]="showNavbar && isChatRoute"
      >
        <router-outlet></router-outlet>
      </main>

      <!-- Modal de cambio de contraseña -->
      <app-change-password-modal
        [isVisible]="showPasswordModal"
        [isFirstLogin]="isFirstLogin"
        (close)="closePasswordModal()"
        (passwordChanged)="onPasswordChanged()">
      </app-change-password-modal>

      <!-- Alert elegante global -->
      <app-alert-modal></app-alert-modal>

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

    .app-container.app-container--chat-view {
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
    }

    @supports (height: 100dvh) {
      .app-container.app-container--chat-view {
        height: 100dvh;
        max-height: 100dvh;
      }
    }

    .app-main {
      flex: 1;
      padding: 1rem;
    }

    .app-main.full-height {
      height: 100vh;
      padding: 0;
    }

    .app-main.app-main--chat {
      padding: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'femimed-dashboard';
  showNavbar = false;
  isChatRoute = false;
  showPasswordModal = false;
  isFirstLogin = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
        this.updateNavbarVisibility(url);
        this.isChatRoute = this.pathOnly(url) === '/chat';
      });

    const initial = this.router.url;
    this.updateNavbarVisibility(initial);
    this.isChatRoute = this.pathOnly(initial) === '/chat';

    this.authService.currentUser$.subscribe(user => {
      if (user && this.authService.needsPasswordChange()) {
        this.isFirstLogin = user.first_login === true;
        this.showPasswordModal = true;
      }
    });
  }

  private pathOnly(url: string): string {
    return url.split('?')[0].split('#')[0] || '/';
  }

  private updateNavbarVisibility(url: string) {
    this.showNavbar = url !== '/login' && this.authService.isAuthenticated();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  onPasswordChanged(): void {
    this.showPasswordModal = false;
    this.authService.updateUserAfterPasswordChange();
  }
}
