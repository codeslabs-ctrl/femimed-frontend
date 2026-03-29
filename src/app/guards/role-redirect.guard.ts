import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { HomePreferencesService } from '../services/home-preferences.service';

export const roleRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const homePrefs = inject(HomePreferencesService);

  if (!authService.isAuthenticated()) {
    console.log('🔐 RoleRedirectGuard: Usuario no autenticado, redirigiendo a login');
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();
  console.log('🔐 RoleRedirectGuard: Usuario autenticado, rol:', currentUser?.rol);

  // Si el usuario está en la ruta raíz, redirigir según su rol
  if (state.url === '/' || state.url === '') {
    return homePrefs.getPreferredHomeRoute(currentUser).pipe(
      map((targetRoute) => {
        console.log('🔐 RoleRedirectGuard: Redirigiendo a página principal:', targetRoute);
        return router.createUrlTree([targetRoute]);
      })
    );
  }

  return true;
};
