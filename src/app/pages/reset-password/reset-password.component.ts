import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="reset-password-container">
      <div class="reset-password-card">
        <div class="reset-password-header">
          <div class="logo">
            <img src="assets/logos/clinica/logo.png" alt="DemoMed Logo" class="logo-image">
            <h2>Restablecer Contraseña</h2>
            <p>Ingresa el código que enviamos a tu email y tu nueva contraseña</p>
          </div>
        </div>
        
        <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="reset-password-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              placeholder="Tu email"
              readonly
              class="readonly-input"
            >
          </div>

          <div class="form-group">
            <label for="otp">Código de Verificación</label>
            <input 
              type="text" 
              id="otp" 
              formControlName="otp" 
              placeholder="Ingresa el código de 8 dígitos"
              maxlength="8"
              [class.error]="resetPasswordForm.get('otp')?.invalid && resetPasswordForm.get('otp')?.touched"
            >
            <div *ngIf="resetPasswordForm.get('otp')?.invalid && resetPasswordForm.get('otp')?.touched" class="error-message">
              <span *ngIf="resetPasswordForm.get('otp')?.errors?.['required']">El código es requerido</span>
              <span *ngIf="resetPasswordForm.get('otp')?.errors?.['minlength']">El código debe tener 8 dígitos</span>
            </div>
          </div>

          <div class="form-group">
            <label for="newPassword">Nueva Contraseña</label>
            <div class="password-input-container">
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                id="newPassword" 
                formControlName="newPassword" 
                placeholder="Ingresa tu nueva contraseña"
                [class.error]="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched"
                class="password-input"
              >
              <button 
                type="button" 
                class="password-toggle" 
                (click)="togglePasswordVisibility()"
                [title]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <span class="password-icon">{{ showPassword ? '🙈' : '👁️' }}</span>
              </button>
            </div>
            <div *ngIf="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched" class="error-message">
              <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['required']">La contraseña es requerida</span>
              <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['minlength']">La contraseña debe tener al menos 6 caracteres</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword" 
              placeholder="Confirma tu nueva contraseña"
              [class.error]="resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched"
            >
            <div *ngIf="resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched" class="error-message">
              <span *ngIf="resetPasswordForm.get('confirmPassword')?.errors?.['required']">La confirmación es requerida</span>
              <span *ngIf="resetPasswordForm.get('confirmPassword')?.errors?.['mismatch']">Las contraseñas no coinciden</span>
            </div>
          </div>

          <button 
            type="submit" 
            class="submit-btn" 
            [disabled]="resetPasswordForm.invalid || isLoading"
            [class.loading]="isLoading"
          >
            <span *ngIf="!isLoading">Restablecer Contraseña</span>
            <span *ngIf="isLoading">Restableciendo...</span>
          </button>

          <div *ngIf="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>

        <div class="reset-password-footer">
          <a routerLink="/login" class="back-to-login">
            ← Volver al Login
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(122, 156, 198, 0.8) 0%, rgba(90, 122, 154, 0.8) 100%);
      padding: 2rem;
    }

    .reset-password-card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      width: 100%;
      max-width: 450px;
    }

    .reset-password-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-image {
      width: 120px;
      height: auto;
      margin-bottom: 1rem;
      background: transparent;
      mix-blend-mode: multiply;
    }

    .reset-password-header h2 {
      color: #374151;
      margin: 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .reset-password-header p {
      color: #6b7280;
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
    }

    .reset-password-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
    }

    .form-group input {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #7A9CC6;
      box-shadow: 0 0 0 3px rgba(122, 156, 198, 0.1);
    }

    .form-group input.error {
      border-color: #ef4444;
    }

    .readonly-input {
      background-color: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
    }

    .password-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input {
      padding-right: 3rem;
      width: 100%;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .password-toggle:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .password-toggle:focus {
      outline: 2px solid #7A9CC6;
      outline-offset: 2px;
    }

    .password-icon {
      font-size: 1.2rem;
      user-select: none;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .success-message {
      color: #10b981;
      font-size: 0.9rem;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 0.5rem;
    }

    .submit-btn {
      background: linear-gradient(135deg, #7A9CC6 0%, #5A7A9A 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 1rem;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(122, 156, 198, 0.3);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .submit-btn.loading {
      position: relative;
    }

    .reset-password-footer {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .back-to-login {
      color: #7A9CC6;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .back-to-login:hover {
      color: #5A7A9A;
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .reset-password-container {
        padding: 1rem;
      }

      .reset-password-card {
        padding: 2rem;
      }

      .logo-image {
        width: 100px;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      email: [''],
      otp: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Obtener email de los query params
    this.route.queryParams.subscribe(params => {
      this.userEmail = params['email'] || '';
      this.resetPasswordForm.patchValue({ email: this.userEmail });
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      if (confirmPassword?.errors?.['mismatch']) {
        delete confirmPassword.errors['mismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email, otp, newPassword } = this.resetPasswordForm.value;

      console.log('🔐 Frontend - Datos del formulario:', { email, otp, newPassword });
      console.log('🔐 Frontend - URL del endpoint:', `${environment.apiUrl}/auth-recovery/reset-password`);

      // Llamar al endpoint de restablecimiento de contraseña
      this.http.post(`${environment.apiUrl}/auth-recovery/reset-password`, { 
        email, 
        otp, 
        newPassword 
      })
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;
            this.successMessage = 'Contraseña restablecida exitosamente. Redirigiendo al login...';
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.error?.error?.message || 'Error al restablecer la contraseña';
            console.error('Error en restablecimiento de contraseña:', error);
          }
        });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
