import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { errorInterceptor } from './app/interceptors/error.interceptor';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Recargar la página si falla la carga de un chunk (p. ej. tras un nuevo despliegue y caché antigua)
function isChunkLoadError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const m = (err as { message?: string; name?: string }).message;
    const n = (err as { message?: string; name?: string }).name;
    return n === 'ChunkLoadError' || (typeof m === 'string' && m.includes('Loading chunk'));
  }
  return false;
}
window.addEventListener('error', (event): boolean => {
  if (isChunkLoadError(event.error) || (event.message && event.message.includes('Loading chunk'))) {
    event.preventDefault();
    window.location.reload();
    return true;
  }
  return false;
});
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    window.location.reload();
  }
});

// Registrar locale español
registerLocaleData(localeEs);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // El orden importa: errorInterceptor primero para capturar errores, luego authInterceptor para agregar token
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor]))
  ]
}).catch(err => console.error(err));
