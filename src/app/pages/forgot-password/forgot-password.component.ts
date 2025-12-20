import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <div class="forgot-password-header">
          <div class="logo">
            <img src="assets/logos/clinica/logo.png" alt="DemoMed Logo" class="logo-image">
            <h2>Recuperar Contraseña</h2>
            <p>Ingresa tu email para recibir un código de recuperación</p>
          </div>
        </div>
        
        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="forgot-password-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              placeholder="Ingresa tu email"
              [class.error]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
            >
            <div *ngIf="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched" class="error-message">
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['required']">El email es requerido</span>
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['email']">Ingresa un email válido</span>
            </div>
          </div>

          <button 
            type="submit" 
            class="submit-btn" 
            [disabled]="forgotPasswordForm.invalid || isLoading"
            [class.loading]="isLoading"
          >
            <span *ngIf="!isLoading">Enviar Código</span>
            <span *ngIf="isLoading">Enviando...</span>
          </button>

          <div *ngIf="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>

        <div class="forgot-password-footer">
          <a routerLink="/login" class="back-to-login">
            ← Volver al Login
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(122, 156, 198, 0.8) 0%, rgba(90, 122, 154, 0.8) 100%);
      padding: 2rem;
    }

    .forgot-password-card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      width: 100%;
      max-width: 400px;
    }

    .forgot-password-header {
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

    .forgot-password-header h2 {
      color: #374151;
      margin: 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .forgot-password-header p {
      color: #6b7280;
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
    }

    .forgot-password-form {
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

    .forgot-password-footer {
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
      .forgot-password-container {
        padding: 1rem;
      }

      .forgot-password-card {
        padding: 2rem;
      }

      .logo-image {
        width: 100px;
      }
    }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    // Component initialization
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email } = this.forgotPasswordForm.value;
      
      console.log('🔐 Frontend - Enviando solicitud de recuperación de contraseña:');
      console.log('  - Email:', email);
      console.log('  - URL:', `${environment.apiUrl}/auth-recovery/password-recovery`);

      // Llamar al endpoint de recuperación de contraseña
      this.http.post(`${environment.apiUrl}/auth-recovery/password-recovery`, { email })
        .subscribe({
          next: (response: any) => {
            console.log('✅ Frontend - Respuesta del servidor:', response);
            this.isLoading = false;
            this.successMessage = 'Se ha enviado un código de recuperación a tu email. Revisa tu bandeja de entrada.';
            
            // Redirigir a la página de verificación OTP después de 2 segundos
            setTimeout(() => {
              this.router.navigate(['/reset-password'], { 
                queryParams: { email: email } 
              });
            }, 2000);
          },
          error: (error) => {
            console.error('❌ Frontend - Error en recuperación de contraseña:', error);
            console.error('❌ Frontend - Error details:', error.error);
            this.isLoading = false;
            this.errorMessage = error.error?.error?.message || 'Error al enviar el código de recuperación';
          }
        });
    }
  }
}
