import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Get the token from the auth service
  const token = authService.getToken();
  
  if (token) {
    // Clone the request and add the authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    console.log('🔐 AuthInterceptor: Token agregado a la petición:', authReq.url);
    return next(authReq);
  }
  
  console.log('🔐 AuthInterceptor: No hay token, enviando petición sin autenticación:', req.url);
  return next(req);
};
