import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { errorInterceptor } from './app/interceptors/error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // El orden importa: errorInterceptor primero para capturar errores, luego authInterceptor para agregar token
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor]))
  ]
}).catch(err => console.error(err));
