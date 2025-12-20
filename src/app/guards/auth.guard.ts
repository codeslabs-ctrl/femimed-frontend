import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('🔐 AuthGuard: Usuario no autenticado, redirigiendo a login desde:', state.url);
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();
  console.log('🔐 AuthGuard: Usuario autenticado, rol:', currentUser?.rol, 'accediendo a:', state.url);

  // Si el usuario de finanzas intenta acceder al dashboard general, redirigir al panel de finanzas
  if (currentUser?.rol === 'finanzas' && state.url === '/dashboard') {
    console.log('🔐 AuthGuard: Usuario de finanzas intentando acceder al dashboard general, redirigiendo a panel de finanzas');
    router.navigate(['/admin/finanzas']);
    return false;
  }

  console.log('🔐 AuthGuard: Permitiendo acceso a:', state.url);
  return true;
};
