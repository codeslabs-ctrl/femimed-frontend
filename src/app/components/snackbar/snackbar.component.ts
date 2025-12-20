import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SnackbarService, SnackbarMessage } from '../../services/snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="currentMessage" 
      class="snackbar"
      [ngClass]="'snackbar-' + currentMessage.type"
      [style.animation-duration]="(currentMessage.duration || 4000) + 'ms'"
    >
      <div class="snackbar-content">
        <div class="snackbar-icon">
          <span *ngIf="currentMessage.type === 'success'">✅</span>
          <span *ngIf="currentMessage.type === 'error'">❌</span>
          <span *ngIf="currentMessage.type === 'warning'">⚠️</span>
          <span *ngIf="currentMessage.type === 'info'">ℹ️</span>
        </div>
        <div class="snackbar-message">{{ currentMessage.message }}</div>
        <button class="snackbar-close" (click)="close()">×</button>
      </div>
    </div>
  `,
  styles: [`
    .snackbar {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      max-width: 500px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    }

    .snackbar-content {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 12px;
    }

    .snackbar-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .snackbar-message {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
    }

    .snackbar-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .snackbar-close:hover {
      opacity: 1;
    }

    .snackbar-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .snackbar-error {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .snackbar-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .snackbar-info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    .snackbar.snackbar-hiding {
      animation: slideOut 0.3s ease-in forwards;
    }

    @media (max-width: 768px) {
      .snackbar {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
        max-width: none;
      }
    }
  `]
})
export class SnackbarComponent implements OnInit, OnDestroy {
  currentMessage: SnackbarMessage | null = null;
  private subscription: Subscription = new Subscription();
  private hideTimeout: any;

  constructor(private snackbarService: SnackbarService) {}

  ngOnInit() {
    this.subscription = this.snackbarService.snackbar$.subscribe(message => {
      if (message) {
        this.showMessage(message);
      } else {
        this.hideMessage();
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  private showMessage(message: SnackbarMessage) {
    this.currentMessage = message;
    
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      this.hideMessage();
    }, message.duration || 4000);
  }

  private hideMessage() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.currentMessage = null;
  }

  close() {
    this.hideMessage();
  }
}

