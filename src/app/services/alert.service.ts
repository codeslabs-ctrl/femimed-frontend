import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertOptions {
  /** Ruta a la que navegar al cerrar (ej. después de éxito) */
  navigateTo?: string;
}

export interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  navigateTo: string | null;
  isConfirm: boolean;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private state$ = new BehaviorSubject<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    navigateTo: null,
    isConfirm: false,
    resolve: null
  });

  constructor(private router: Router) {}

  getState() {
    return this.state$.asObservable();
  }

  get currentState(): AlertState {
    return this.state$.value;
  }

  private getTitleForType(type: AlertType): string {
    switch (type) {
      case 'success': return 'Éxito';
      case 'error': return 'Error';
      case 'warning': return 'Atención';
      case 'info': return 'Información';
      default: return 'Información';
    }
  }

  /**
   * Muestra el alert elegante (un solo botón Aceptar).
   * Si options.navigateTo está definido, al cerrar se navega a esa ruta.
   */
  show(message: string, type: AlertType = 'info', options?: AlertOptions): void {
    this.state$.next({
      visible: true,
      title: this.getTitleForType(type),
      message,
      type,
      navigateTo: options?.navigateTo ?? null,
      isConfirm: false,
      resolve: null
    });
  }

  showSuccess(message: string, options?: AlertOptions): void {
    this.show(message, 'success', options);
  }

  showError(message: string): void {
    this.show(message, 'error');
  }

  showWarning(message: string): void {
    this.show(message, 'warning');
  }

  showInfo(message: string): void {
    this.show(message, 'info');
  }

  /**
   * Muestra un diálogo de confirmación (Aceptar / Cancelar).
   * @returns Promise<boolean> true si el usuario pulsa Aceptar, false si Cancelar
   */
  confirm(message: string, title: string = 'Confirmar'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state$.next({
        visible: true,
        title,
        message,
        type: 'info',
        navigateTo: null,
        isConfirm: true,
        resolve: (value: boolean) => {
          this.close();
          resolve(value);
        }
      });
    });
  }

  close(): void {
    const state = this.state$.value;
    if (state.navigateTo) {
      this.router.navigate([state.navigateTo]);
    }
    this.state$.next({
      visible: false,
      title: '',
      message: '',
      type: 'info',
      navigateTo: null,
      isConfirm: false,
      resolve: null
    });
  }

  /** Llamado por el componente cuando el usuario pulsa Aceptar en modo confirm */
  acceptConfirm(): void {
    const state = this.state$.value;
    if (state.resolve) {
      state.resolve(true);
    }
    this.close();
  }

  /** Llamado por el componente cuando el usuario pulsa Cancelar en modo confirm */
  cancelConfirm(): void {
    const state = this.state$.value;
    if (state.resolve) {
      state.resolve(false);
    }
    this.close();
  }
}
