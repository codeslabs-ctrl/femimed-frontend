import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor que maneja errores HTTP de forma centralizada
 * Evita cerrar sesión incorrectamente en errores de validación
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const snackbarService = inject(SnackbarService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('🔍 ErrorInterceptor: Error detectado', {
        url: req.url,
        status: error.status,
        message: error.error?.message || error.message
      });

      // Solo manejar errores HTTP
      if (!error || !error.status) {
        console.log('⚠️ ErrorInterceptor: Error no es HTTP, pasando sin modificar');
        return throwError(() => error);
      }

      const status = error.status;
      const errorMessage = error.error?.message || error.message || '';

      // Errores de autenticación (401) - Solo cerrar sesión si es realmente un problema de token
      if (status === 401) {
        // Verificar si es un error de rate limiting (no cerrar sesión)
        if (errorMessage.includes('Demasiados intentos') || errorMessage.includes('rate limit')) {
          console.log('⚠️ ErrorInterceptor: Error 401 por rate limiting, NO cerrando sesión');
          return throwError(() => error);
        }

        // Verificar si es un error de validación que devuelve 401 incorrectamente
        // (por ejemplo, email duplicado, cédula duplicada, etc.)
        const validationErrorKeywords = [
          'email',
          'cedula',
          'duplicate',
          'ya existe',
          'validation',
          'validación',
          'requerido',
          'required',
          'inválido',
          'invalid'
        ];

        const isValidationError = validationErrorKeywords.some(keyword =>
          errorMessage.toLowerCase().includes(keyword.toLowerCase())
        );

        if (isValidationError) {
          console.log('⚠️ ErrorInterceptor: Error 401 parece ser de validación, NO cerrando sesión');
          console.log('📝 Mensaje:', errorMessage);
          return throwError(() => error);
        }

        // Si es un 401 real (token inválido/expirado), cerrar sesión
        console.log('🔐 ErrorInterceptor: Error 401 real detectado, cerrando sesión');
        console.log('📝 Mensaje:', errorMessage);
        
        // Solo cerrar sesión si el token existe (significa que expiró o es inválido)
        if (authService.getToken()) {
          console.log('🚪 ErrorInterceptor: Token existe pero es inválido, cerrando sesión');
          snackbarService.showWarning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 5000);
          authService.logout();
        }
        
        return throwError(() => error);
      }

      // Errores de rate limiting (429) - No cerrar sesión, mostrar mensaje
      if (status === 429) {
        console.log('⚠️ ErrorInterceptor: Error 429 (Rate Limit), NO cerrando sesión');
        const rateLimitMessage = error.error?.message || errorMessage || 'Demasiados intentos. Por favor, espera unos minutos.';
        snackbarService.showError(rateLimitMessage, 8000);
        return throwError(() => error);
      }

      // Errores de autorización (403) - No cerrar sesión, solo propagar el error
      if (status === 403) {
        console.log('⚠️ ErrorInterceptor: Error 403 (Prohibido), NO cerrando sesión');
        return throwError(() => error);
      }

      // Errores 404 - No cerrar sesión automáticamente
      // Un 404 puede ser un recurso no encontrado, no necesariamente sesión expirada
      if (status === 404) {
        console.log('⚠️ ErrorInterceptor: Error 404 (Not Found) - NO cerrando sesión');
        // Solo mostrar mensaje si es un error de autenticación explícito
        // Los 404 de recursos no encontrados se manejan en el componente
        return throwError(() => error);
      }

      // Errores de validación (400, 422) - No cerrar sesión
      if (status === 400 || status === 422) {
        console.log('⚠️ ErrorInterceptor: Error de validación (400/422), NO cerrando sesión');
        return throwError(() => error);
      }

      // Errores de servidor (500+) - No cerrar sesión
      if (status >= 500) {
        console.log('⚠️ ErrorInterceptor: Error de servidor (500+), NO cerrando sesión');
        return throwError(() => error);
      }

      // Errores de red (0) - No cerrar sesión
      if (status === 0) {
        console.log('⚠️ ErrorInterceptor: Error de red (0), NO cerrando sesión');
        return throwError(() => error);
      }

      // Para cualquier otro error, solo propagarlo sin cerrar sesión
      console.log('⚠️ ErrorInterceptor: Otro tipo de error, pasando sin modificar');
      return throwError(() => error);
    })
  );
};

