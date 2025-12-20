import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Genera un mensaje de error seguro para mostrar al usuario
   * @param error - Error original del backend
   * @param context - Contexto de la operación (ej: 'crear informe', 'editar paciente')
   * @returns Mensaje seguro para el usuario
   */
  getSafeErrorMessage(error: any, context: string = 'operación'): string {
    // Siempre mostrar mensajes genéricos y seguros
    return `❌ Error en ${context}. Por favor, verifica los datos e intenta de nuevo.`;
  }

  /**
   * Sanitiza un mensaje para remover información sensible
   * @param message - Mensaje original
   * @returns Mensaje sanitizado
   */
  private sanitizeMessage(message: string): string {
    if (!message) return 'Error desconocido';
    
    // Remover información sensible común
    let sanitized = message
      .replace(/http[s]?:\/\/[^\s]+/g, '[URL]') // URLs
      .replace(/localhost:\d+/g, '[SERVIDOR]') // localhost:puerto
      .replace(/api\/v\d+\/[^\s]+/g, '[ENDPOINT]') // endpoints de API
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g, '[EMAIL]') // emails
      .replace(/\b\d{4,}\b/g, '[ID]') // IDs numéricos largos
      .replace(/column\s+[a-zA-Z_]+\.\w+\s+does\s+not\s+exist/gi, 'Campo no encontrado')
      .replace(/Could not find the '[^']+' column/gi, 'Campo no encontrado')
      .replace(/duplicate key value violates unique constraint/gi, 'El valor ya existe')
      .replace(/violates foreign key constraint/gi, 'Referencia no válida')
      .replace(/permission denied/gi, 'Sin permisos')
      .replace(/unauthorized/gi, 'Sin autorización')
      .replace(/forbidden/gi, 'Acceso denegado')
      .replace(/not found/gi, 'No encontrado')
      .replace(/bad request/gi, 'Solicitud inválida')
      .replace(/internal server error/gi, 'Error interno del servidor');

    return sanitized;
  }

  /**
   * Log seguro para debugging (solo en consola, no en UI)
   * @param error - Error original
   * @param context - Contexto de la operación
   * @param additionalData - Datos adicionales para debugging
   */
  logError(error: any, context: string, additionalData?: any): void {
    if (!environment.production) {
      console.group(`🔍 Error en ${context}`);
      console.error('Error original:', error);
      if (additionalData) {
        console.log('Datos adicionales:', additionalData);
      }
      console.groupEnd();
    }
  }

  /**
   * Log de información general (solo en consola)
   * @param message - Mensaje a loggear
   * @param data - Datos adicionales
   */
  logInfo(message: string, data?: any): void {
    if (!environment.production) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  }

  /**
   * Log de advertencia (solo en consola)
   * @param message - Mensaje de advertencia
   * @param data - Datos adicionales
   */
  logWarning(message: string, data?: any): void {
    if (!environment.production) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  }

  /**
   * Valida si un error es de tipo HTTP
   * @param error - Error a validar
   * @returns true si es error HTTP
   */
  isHttpError(error: any): boolean {
    return error && (error.status || error.error?.status);
  }

  /**
   * Obtiene el código de estado HTTP de manera segura
   * @param error - Error a analizar
   * @returns Código de estado o null
   */
  getHttpStatus(error: any): number | null {
    if (this.isHttpError(error)) {
      return error.status || error.error?.status || null;
    }
    return null;
  }

  /**
   * Determina si un error es de validación
   * @param error - Error a analizar
   * @returns true si es error de validación
   */
  isValidationError(error: any): boolean {
    const status = this.getHttpStatus(error);
    return status === 400 || status === 422;
  }

  /**
   * Determina si un error es de autorización
   * @param error - Error a analizar
   * @returns true si es error de autorización
   */
  isAuthorizationError(error: any): boolean {
    const status = this.getHttpStatus(error);
    return status === 401 || status === 403;
  }

  /**
   * Determina si un error es de servidor
   * @param error - Error a analizar
   * @returns true si es error de servidor
   */
  isServerError(error: any): boolean {
    const status = this.getHttpStatus(error);
    return status !== null && status >= 500;
  }
}
