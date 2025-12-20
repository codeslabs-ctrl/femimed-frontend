import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('🔐 AdminOnlyGuard: Usuario no autenticado, redirigiendo a login desde:', state.url);
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();
  console.log('🔐 AdminOnlyGuard: Usuario autenticado, rol:', currentUser?.rol, 'accediendo a:', state.url);

  // Solo permitir acceso a administradores
  if (currentUser?.rol !== 'administrador') {
    console.log('🔐 AdminOnlyGuard: Acceso denegado para rol:', currentUser?.rol);
    router.navigate(['/dashboard']);
    return false;
  }

  console.log('🔐 AdminOnlyGuard: Permitiendo acceso a:', state.url);
  return true;
};
