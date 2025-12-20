import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmar-eliminar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" (click)="onCancel()">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-header">
          <div class="confirm-icon">⚠️</div>
          <h3>Confirmar Eliminación</h3>
        </div>
        
        <div class="confirm-body">
          <p>¿Estás seguro de que quieres eliminar el mensaje?</p>
          <div class="mensaje-preview">
            <strong>{{ mensaje?.titulo }}</strong>
          </div>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>

        <div class="confirm-footer">
          <button type="button" class="btn btn-cancel" (click)="onCancel()">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" (click)="onConfirm()">
            🗑️ Eliminar
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
      background: #fef2f2;
      border-radius: 8px 8px 0 0;
    }

    .confirm-icon {
      font-size: 1.5rem;
    }

    .confirm-header h3 {
      margin: 0;
      color: #dc2626;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .confirm-body {
      padding: 20px;
    }

    .confirm-body p {
      margin: 0 0 12px 0;
      color: #374151;
      line-height: 1.5;
    }

    .mensaje-preview {
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

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
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
export class ConfirmarEliminarComponent {
  @Input() mensaje: any = null;
  @Input() show: boolean = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}



