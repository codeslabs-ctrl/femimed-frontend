import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('🔐 RoleRedirectGuard: Usuario no autenticado, redirigiendo a login');
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();
  console.log('🔐 RoleRedirectGuard: Usuario autenticado, rol:', currentUser?.rol);

  // Si el usuario está en la ruta raíz, redirigir según su rol
  if (state.url === '/' || state.url === '') {
    if (currentUser?.rol === 'finanzas') {
      console.log('🔐 RoleRedirectGuard: Redirigiendo usuario de finanzas a panel de finanzas');
      router.navigate(['/admin/finanzas']);
      return false;
    } else {
      console.log('🔐 RoleRedirectGuard: Redirigiendo usuario a dashboard general');
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
