import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { errorInterceptor } from './app/interceptors/error.interceptor';
import { GlobalErrorHandler } from './app/handlers/global-error.handler';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // El orden importa: errorInterceptor primero para capturar errores, luego authInterceptor para agregar token
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    // ErrorHandler global para capturar errores no HTTP (como ChunkLoadError)
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
}).catch(err => {
  console.error('❌ Error al iniciar la aplicación:', err);
  // Mostrar mensaje incluso si el bootstrap falla
  alert('Error al iniciar la aplicación. Por favor, recarga la página.');
});
