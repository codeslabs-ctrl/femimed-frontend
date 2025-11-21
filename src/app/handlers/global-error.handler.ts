import { ErrorHandler, Injectable, inject } from '@angular/core';
import { SnackbarService } from '../services/snackbar.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private snackbarService = inject(SnackbarService);

  handleError(error: any): void {
    console.error('🚨 GlobalErrorHandler: Error capturado', error);

    // Detectar ChunkLoadError (error de carga de módulos/chunks)
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk') || error?.message?.includes('ChunkLoadError')) {
      console.error('❌ ChunkLoadError detectado:', error);
      this.snackbarService.showError(
        'Error al cargar la aplicación. Por favor, recarga la página (Ctrl+Shift+R o Cmd+Shift+R) para obtener la versión más reciente.',
        10000
      );
      return;
    }

    // Detectar errores de red/fallo de carga
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      console.error('❌ Error de red detectado:', error);
      this.snackbarService.showError(
        'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.',
        8000
      );
      return;
    }

    // Detectar errores de módulo no encontrado
    if (error?.message?.includes('Cannot find module') || error?.message?.includes('Module not found')) {
      console.error('❌ Módulo no encontrado:', error);
      this.snackbarService.showError(
        'Error al cargar un módulo de la aplicación. Por favor, recarga la página.',
        8000
      );
      return;
    }

    // Para otros errores no manejados, mostrar mensaje genérico
    // Solo en desarrollo mostrar detalles completos
    if (!error?.status) { // Si no es un error HTTP (ya manejado por el interceptor)
      const isDevelopment = !window.location.hostname.includes('codes-labs.com');
      
      if (isDevelopment) {
        console.error('❌ Error no manejado (desarrollo):', error);
        this.snackbarService.showError(
          `Error: ${error?.message || 'Error desconocido'}. Revisa la consola para más detalles.`,
          8000
        );
      } else {
        // En producción, mostrar mensaje genérico
        console.error('❌ Error no manejado (producción):', error);
        this.snackbarService.showError(
          'Ha ocurrido un error inesperado. Por favor, recarga la página o contacta al administrador.',
          8000
        );
      }
    }
  }
}

