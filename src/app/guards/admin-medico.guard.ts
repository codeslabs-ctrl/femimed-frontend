import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminMedicoGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('🔐 AdminMedicoGuard: Usuario no autenticado, redirigiendo a login desde:', state.url);
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();
  console.log('🔐 AdminMedicoGuard: Usuario autenticado, rol:', currentUser?.rol, 'accediendo a:', state.url);

  // Permitir acceso a administradores, médicos y secretarias
  if (currentUser?.rol !== 'administrador' && currentUser?.rol !== 'medico' && currentUser?.rol !== 'secretaria') {
    console.log('🔐 AdminMedicoGuard: Acceso denegado para rol:', currentUser?.rol);
    router.navigate(['/dashboard']);
    return false;
  }

  console.log('🔐 AdminMedicoGuard: Permitiendo acceso a:', state.url);
  return true;
};
