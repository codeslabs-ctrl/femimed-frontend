import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" (click)="onCancel()">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-header" [class]="getHeaderClass()">
          <div class="confirm-icon">{{ getIcon() }}</div>
          <h3>{{ title }}</h3>
        </div>
        
        <div class="confirm-body">
          <p>{{ message }}</p>
          <div class="item-preview" *ngIf="itemName">
            <strong>{{ itemName }}</strong>
          </div>
          <p class="warning-text" *ngIf="showWarning">{{ warningText }}</p>
        </div>

        <div class="confirm-footer">
          <button type="button" class="btn btn-cancel" (click)="onCancel()">
            {{ cancelText }}
          </button>
          <button type="button" class="btn btn-confirm" [class]="getConfirmClass()" (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .confirm-modal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 400px;
    }

    .confirm-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      border-radius: 8px 8px 0 0;
    }

    .confirm-header-danger {
      background: #fef2f2;
    }

    .confirm-header-warning {
      background: #fffbeb;
    }

    .confirm-header-info {
      background: #eff6ff;
    }

    .confirm-icon {
      font-size: 1.5rem;
    }

    .confirm-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .confirm-header-danger h3 {
      color: #dc2626;
    }

    .confirm-header-warning h3 {
      color: #d97706;
    }

    .confirm-header-info h3 {
      color: #2563eb;
    }

    .confirm-body {
      padding: 20px;
    }

    .confirm-body p {
      margin: 0 0 12px 0;
      color: #374151;
      line-height: 1.5;
    }

    .item-preview {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
    }

    .warning-text {
      color: #dc2626;
      font-size: 0.9rem;
      font-weight: 500;
      margin: 12px 0 0 0;
    }

    .confirm-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      border-radius: 0 0 8px 8px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .btn-cancel {
      background: #6b7280;
      color: white;
    }

    .btn-cancel:hover {
      background: #4b5563;
    }

    .btn-confirm-danger {
      background: #dc2626;
      color: white;
    }

    .btn-confirm-danger:hover {
      background: #b91c1c;
    }

    .btn-confirm-warning {
      background: #d97706;
      color: white;
    }

    .btn-confirm-warning:hover {
      background: #b45309;
    }

    .btn-confirm-info {
      background: #2563eb;
      color: white;
    }

    .btn-confirm-info:hover {
      background: #1d4ed8;
    }

    @media (max-width: 640px) {
      .confirm-modal {
        width: 95%;
        margin: 20px;
      }
      
      .confirm-header,
      .confirm-body,
      .confirm-footer {
        padding: 16px;
      }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() show: boolean = false;
  @Input() title: string = 'Confirmar Acción';
  @Input() message: string = '¿Estás seguro de que quieres realizar esta acción?';
  @Input() itemName: string = '';
  @Input() warningText: string = 'Esta acción no se puede deshacer.';
  @Input() showWarning: boolean = true;
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  getIcon(): string {
    switch (this.type) {
      case 'danger': return '⚠️';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '⚠️';
    }
  }

  getHeaderClass(): string {
    return `confirm-header-${this.type}`;
  }

  getConfirmClass(): string {
    return `btn-confirm-${this.type}`;
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}



