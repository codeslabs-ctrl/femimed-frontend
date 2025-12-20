import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  private readonly timezone = environment.timezone;
  private readonly dateFormat = environment.dateFormat;
  private readonly currency = environment.currency;

  constructor() {}

  /**
   * Formatea una fecha usando la configuración de Venezuela
   * @param dateString - Fecha en formato string (ISO o cualquier formato válido)
   * @param options - Opciones adicionales para el formateo
   * @returns Fecha formateada en español venezolano
   */
  formatDate(dateString: string | undefined | null, options?: Intl.DateTimeFormatOptions): string {
    if (!dateString) return '';
    
    try {
      // Si es una fecha en formato YYYY-MM-DD (sin hora), tratarla como fecha local
      let date: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Crear fecha local para evitar problemas de timezone
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateString);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateString);
        return '';
      }

      const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: this.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...options
      };

      return date.toLocaleDateString(this.dateFormat, defaultOptions);
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  }

  /**
   * Formatea una fecha con hora usando la configuración de Venezuela
   * @param dateString - Fecha en formato string
   * @param options - Opciones adicionales para el formateo
   * @returns Fecha y hora formateada en español venezolano
   */
  formatDateTime(dateString: string | undefined | null, options?: Intl.DateTimeFormatOptions): string {
    if (!dateString) return '';
    
    try {
      // Si es una fecha en formato YYYY-MM-DD (sin hora), tratarla como fecha local
      let date: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Crear fecha local para evitar problemas de timezone
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateString);
        return '';
      }

      const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: this.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...options
      };

      return date.toLocaleString(this.dateFormat, defaultOptions);
    } catch (error) {
      console.error('Error formateando fecha y hora:', error);
      return '';
    }
  }

  /**
   * Formatea solo la hora usando la configuración de Venezuela
   * @param timeString - Hora en formato string (HH:MM:SS o HH:MM)
   * @returns Hora formateada
   */
  formatTime(timeString: string | undefined | null): string {
    if (!timeString) return '';
    
    // Si es solo hora (HH:MM:SS), extraer solo HH:MM
    if (timeString.includes(':')) {
      return timeString.substring(0, 5);
    }
    
    return timeString;
  }

  /**
   * Obtiene la fecha actual en la zona horaria de Venezuela
   * @returns Fecha actual formateada
   */
  getCurrentDate(): string {
    return this.formatDate(new Date().toISOString());
  }

  /**
   * Obtiene la fecha y hora actual en la zona horaria de Venezuela
   * @returns Fecha y hora actual formateada
   */
  getCurrentDateTime(): string {
    return this.formatDateTime(new Date().toISOString());
  }

  /**
   * Obtiene la fecha actual en formato ISO para la zona horaria de Venezuela
   * @returns Fecha actual en formato ISO
   */
  getCurrentDateISO(): string {
    const now = new Date();
    // Ajustar a la zona horaria de Venezuela (UTC-4)
    const venezuelaOffset = -4 * 60; // -4 horas en minutos
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const venezuelaTime = new Date(utc + (venezuelaOffset * 60000));
    return venezuelaTime.toISOString().split('T')[0];
  }

  /**
   * Obtiene la hora actual en formato HH:MM para la zona horaria de Venezuela
   * @returns Hora actual formateada
   */
  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString(this.dateFormat, {
      timeZone: this.timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Convierte una fecha a la zona horaria de Venezuela
   * @param dateString - Fecha en cualquier formato
   * @returns Fecha ajustada a Venezuela
   */
  toVenezuelaTime(dateString: string): Date {
    const date = new Date(dateString);
    const venezuelaOffset = -4 * 60; // -4 horas en minutos
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (venezuelaOffset * 60000));
  }

  /**
   * Verifica si una fecha es válida
   * @param dateString - Fecha en formato string
   * @returns true si la fecha es válida
   */
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Obtiene la diferencia en días entre dos fechas
   * @param date1 - Primera fecha
   * @param date2 - Segunda fecha
   * @returns Diferencia en días
   */
  getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene el símbolo de moneda configurado
   * @param currencyCode - Código de moneda específico (opcional)
   * @returns Símbolo de moneda (ej: Bs.S, $, €)
   */
  getCurrencySymbol(currencyCode?: string): string {
    // Mapeo de códigos de moneda a símbolos
    const currencySymbols: { [key: string]: string } = {
      'VES': 'Bs.S',
      'USD': '$',
      'EUR': '€',
      'COP': '$',
      'ARS': '$',
      'MXN': '$'
    };
    
    const code = currencyCode || this.currency;
    return currencySymbols[code] || code;
  }
}
