import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService, AlertState, AlertType } from '../../services/alert.service';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert-overlay" *ngIf="state.visible" (click)="onOverlayClick()">
      <div
        class="alert-box"
        [class.alert-success]="state.type === 'success'"
        [class.alert-error]="state.type === 'error'"
        [class.alert-warning]="state.type === 'warning'"
        [class.alert-info]="state.type === 'info'"
        (click)="$event.stopPropagation()"
      >
        <div class="alert-icon">
          <i class="fas fa-check-circle" *ngIf="state.type === 'success'"></i>
          <i class="fas fa-exclamation-circle" *ngIf="state.type === 'error'"></i>
          <i class="fas fa-exclamation-triangle" *ngIf="state.type === 'warning'"></i>
          <i class="fas fa-info-circle" *ngIf="state.type === 'info'"></i>
        </div>
        <h3 class="alert-title">{{ state.title }}</h3>
        <p class="alert-message">{{ state.message }}</p>
        <div class="alert-actions">
          <ng-container *ngIf="state.isConfirm">
            <button type="button" class="alert-btn alert-btn-cancel" (click)="cancel()">Cancelar</button>
            <button type="button" class="alert-btn alert-btn-primary" (click)="accept()">Aceptar</button>
          </ng-container>
          <button
            *ngIf="!state.isConfirm"
            type="button"
            class="alert-btn alert-btn-primary"
            (click)="close()"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alert-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1060;
      animation: alertFadeIn 0.2s ease;
    }
    @keyframes alertFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .alert-box {
      background: white;
      border-radius: 1rem;
      padding: 2rem 2.25rem;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: alertSlideIn 0.3s ease;
    }
    @keyframes alertSlideIn {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .alert-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
      line-height: 1;
    }
    .alert-box.alert-success .alert-icon { color: #059669; }
    .alert-box.alert-error .alert-icon { color: #dc2626; }
    .alert-box.alert-warning .alert-icon { color: #d97706; }
    .alert-box.alert-info .alert-icon { color: #e64f62; }
    .alert-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }
    .alert-message {
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
      white-space: pre-line;
    }
    .alert-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .alert-btn {
      padding: 0.625rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .alert-btn-primary {
      color: white;
    }
    .alert-box.alert-success .alert-btn-primary {
      background: linear-gradient(135deg, #059669, #047857);
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
    }
    .alert-box.alert-error .alert-btn-primary {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    }
    .alert-box.alert-warning .alert-btn-primary {
      background: linear-gradient(135deg, #d97706, #b45309);
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
    }
    .alert-box.alert-info .alert-btn-primary {
      background: linear-gradient(135deg, #f5576c, #e64f62);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    .alert-btn-primary:hover {
      transform: translateY(-1px);
    }
    .alert-btn-cancel {
      background: #e5e7eb;
      color: #374151;
    }
    .alert-btn-cancel:hover {
      background: #d1d5db;
    }
  `]
})
export class AlertModalComponent implements OnInit, OnDestroy {
  state: AlertState = {
    visible: false,
    title: '',
    message: '',
    type: 'info',
    navigateTo: null,
    isConfirm: false,
    resolve: null
  };
  private sub?: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.sub = this.alertService.getState().subscribe(s => {
      this.state = { ...s };
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onOverlayClick() {
    if (!this.state.isConfirm) {
      this.close();
    }
  }

  close() {
    this.alertService.close();
  }

  accept() {
    this.alertService.acceptConfirm();
  }

  cancel() {
    this.alertService.cancelConfirm();
  }
}
