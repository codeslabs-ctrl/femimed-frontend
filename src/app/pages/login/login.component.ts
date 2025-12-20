import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  isRateLimited = false;
  timeRemaining = 0;
  currentYear = new Date().getFullYear();
  private countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Si ya está autenticado, redirigir según el rol
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (response) => {
          console.log('🔐 Login successful, response:', response);
          this.isLoading = false;
          // Esperar un momento para que el usuario se cargue completamente
          setTimeout(() => {
            this.redirectBasedOnRole();
          }, 100);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.logError(error, 'iniciar sesión');
          this.errorMessage = this.getLoginErrorMessage(error);
        }
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private getLoginErrorMessage(error: any): string {
    // Error de rate limiting - manejo específico para login
    if (error.status === 401 && error.error?.message && error.error.message.includes('Demasiados intentos')) {
      this.startRateLimitCountdown();
      return '🚫 Demasiados intentos de login. Debes esperar 15 minutos antes de intentar nuevamente.';
    }
    
    if (error.status === 429) {
      this.startRateLimitCountdown();
      return '🚫 Demasiados intentos de login. Debes esperar 15 minutos antes de intentar nuevamente.';
    }
    
    // Error 401 - No autorizado (sin rate limiting)
    if (error.status === 401) {
      return '❌ Usuario o contraseña incorrectos. Verifica tus credenciales.';
    }
    
    // Error 403 - Prohibido
    if (error.status === 403) {
      return '❌ Acceso denegado. Tu cuenta puede estar deshabilitada.';
    }
    
    // Para otros errores, usar el ErrorHandlerService
    return this.errorHandler.getSafeErrorMessage(error, 'iniciar sesión');
  }

  private startRateLimitCountdown() {
    this.isRateLimited = true;
    this.timeRemaining = 15 * 60; // 15 minutos en segundos
    
    this.countdownInterval = setInterval(() => {
      this.timeRemaining--;
      
      if (this.timeRemaining <= 0) {
        this.isRateLimited = false;
        this.errorMessage = '';
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  private stopRateLimitCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.isRateLimited = false;
    this.timeRemaining = 0;
  }

  getFormattedTimeRemaining(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private redirectBasedOnRole() {
    const currentUser = this.authService.getCurrentUser();
    console.log('🔍 Current user for redirection:', currentUser);
    console.log('🔍 User role:', currentUser?.rol);
    console.log('🔍 Role comparison:', currentUser?.rol === 'finanzas');
    
    if (currentUser?.rol === 'finanzas') {
      console.log('✅ Redirecting to finanzas panel');
      // Redirigir directamente al panel de finanzas
      this.router.navigate(['/admin/finanzas']);
    } else {
      console.log('✅ Redirecting to general dashboard');
      // Para otros roles, ir al dashboard general
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy() {
    this.stopRateLimitCountdown();
  }
}
