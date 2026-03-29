import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Solo usuarios con rol médico (Récipe médico y herramientas exclusivas del médico). */
export const medicoOnlyGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const user = authService.getCurrentUser();
  if (user?.rol !== 'medico' || !user?.medico_id) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
