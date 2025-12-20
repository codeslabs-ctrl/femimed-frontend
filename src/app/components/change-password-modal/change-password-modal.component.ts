import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Cambiar Contraseña</h2>
          <button class="close-btn" (click)="closeModal()" type="button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="welcome-message" *ngIf="isFirstLogin">
            <div class="welcome-icon">🔐</div>
            <h3>¡Bienvenido!</h3>
            <p>Por seguridad, debes cambiar tu contraseña temporal por una más segura y fácil de recordar.</p>
          </div>
          
          <form #passwordForm="ngForm" (ngSubmit)="onSubmit()" class="password-form">
            <div class="form-group" *ngIf="!isFirstLogin">
              <label for="currentPassword">Contraseña Actual</label>
              <div class="input-container">
                <input 
                  [type]="showCurrentPassword ? 'text' : 'password'" 
                  id="currentPassword"
                  name="currentPassword"
                  [(ngModel)]="formData.currentPassword"
                  #currentPasswordInput="ngModel"
                  required
                  class="form-input"
                  [class.error]="currentPasswordInput.invalid && currentPasswordInput.touched"
                  placeholder="Ingresa tu contraseña actual">
                <button 
                  type="button" 
                  class="toggle-password"
                  (click)="togglePasswordVisibility('current')"
                  [attr.aria-label]="showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <svg viewBox="0 0 24 24" fill="currentColor" *ngIf="!showCurrentPassword">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" fill="currentColor" *ngIf="showCurrentPassword">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </button>
              </div>
              <div class="error-message" *ngIf="currentPasswordInput.invalid && currentPasswordInput.touched">
                La contraseña actual es requerida
              </div>
            </div>
            
            <div class="form-group">
              <label for="newPassword">Nueva Contraseña</label>
              <div class="input-container">
                <input 
                  [type]="showNewPassword ? 'text' : 'password'" 
                  id="newPassword"
                  name="newPassword"
                  [(ngModel)]="formData.newPassword"
                  #newPasswordInput="ngModel"
                  required
                  minlength="6"
                  class="form-input"
                  [class.error]="newPasswordInput.invalid && newPasswordInput.touched"
                  placeholder="Ingresa tu nueva contraseña">
                <button 
                  type="button" 
                  class="toggle-password"
                  (click)="togglePasswordVisibility('new')"
                  [attr.aria-label]="showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <svg viewBox="0 0 24 24" fill="currentColor" *ngIf="!showNewPassword">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" fill="currentColor" *ngIf="showNewPassword">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </button>
              </div>
              <div class="error-message" *ngIf="newPasswordInput.invalid && newPasswordInput.touched">
                <span *ngIf="newPasswordInput.errors?.['required']">La nueva contraseña es requerida</span>
                <span *ngIf="newPasswordInput.errors?.['minlength']">La contraseña debe tener al menos 6 caracteres</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirmar Nueva Contraseña</label>
              <div class="input-container">
                <input 
                  [type]="showConfirmPassword ? 'text' : 'password'" 
                  id="confirmPassword"
                  name="confirmPassword"
                  [(ngModel)]="formData.confirmPassword"
                  #confirmPasswordInput="ngModel"
                  required
                  class="form-input"
                  [class.error]="(confirmPasswordInput.invalid || !passwordsMatch()) && confirmPasswordInput.touched"
                  placeholder="Confirma tu nueva contraseña">
                <button 
                  type="button" 
                  class="toggle-password"
                  (click)="togglePasswordVisibility('confirm')"
                  [attr.aria-label]="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <svg viewBox="0 0 24 24" fill="currentColor" *ngIf="!showConfirmPassword">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" fill="currentColor" *ngIf="showConfirmPassword">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </button>
              </div>
              <div class="error-message" *ngIf="(confirmPasswordInput.invalid || !passwordsMatch()) && confirmPasswordInput.touched">
                <span *ngIf="confirmPasswordInput.errors?.['required']">La confirmación de contraseña es requerida</span>
                <span *ngIf="!passwordsMatch() && confirmPasswordInput.touched">Las contraseñas no coinciden</span>
              </div>
            </div>
            
            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="closeModal()"
                [disabled]="isLoading">
                Cancelar
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="!passwordForm.valid || !passwordsMatch() || isLoading">
                <span *ngIf="isLoading" class="loading-spinner"></span>
                {{ isFirstLogin ? 'Establecer Contraseña' : 'Cambiar Contraseña' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      color: #6b7280;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .close-btn svg {
      width: 20px;
      height: 20px;
    }

    .modal-body {
      padding: 0 24px 24px;
    }

    .welcome-message {
      text-align: center;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #E8F0F8 0%, #D4E4F0 100%);
      border-radius: 12px;
      border: 1px solid #B8D4E8;
    }

    .welcome-icon {
      font-size: 2.5rem;
      margin-bottom: 16px;
    }

    .welcome-message h3 {
      margin: 0 0 12px;
      color: #5A7A9A;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .welcome-message p {
      margin: 0;
      color: #4A6A8A;
      line-height: 1.5;
    }

    .password-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .input-container {
      position: relative;
    }

    .form-input {
      width: 100%;
      padding: 12px 48px 12px 12px;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #7A9CC6;
      box-shadow: 0 0 0 3px rgba(122, 156, 198, 0.1);
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #6b7280;
      transition: color 0.2s;
    }

    .toggle-password:hover {
      color: #374151;
    }

    .toggle-password svg {
      width: 20px;
      height: 20px;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-primary {
      background: linear-gradient(135deg, #7A9CC6 0%, #5A7A9A 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #8BA8D1 0%, #6A8AAA 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(122, 156, 198, 0.3);
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .modal-container {
        margin: 20px;
        max-width: none;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ChangePasswordModalComponent {
  @Input() isVisible = false;
  @Input() isFirstLogin = false;
  @Output() close = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<void>();

  formData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  passwordsMatch(): boolean {
    return this.formData.newPassword === this.formData.confirmPassword;
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.isLoading = false;
  }

  onSubmit(): void {
    if (!this.passwordsMatch()) {
      return;
    }

    this.isLoading = true;

    const payload = {
      currentPassword: this.formData.currentPassword,
      newPassword: this.formData.newPassword,
      isFirstLogin: this.isFirstLogin
    };

    // Obtener token del localStorage
    const token = localStorage.getItem('demomed_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(`${environment.apiUrl}/auth/change-password`, payload, { headers }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.errorHandler.logInfo('Contraseña cambiada exitosamente', response);
        if (response.success) {
          this.passwordChanged.emit();
          this.closeModal();
        } else {
          const errorMessage = this.errorHandler.getSafeErrorMessage(response, 'cambiar contraseña');
          alert(errorMessage);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.logError(error, 'cambiar contraseña');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'cambiar contraseña');
        alert(errorMessage);
      }
    });
  }
}
