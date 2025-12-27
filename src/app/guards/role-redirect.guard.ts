import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HomePreferencesService } from '../services/home-preferences.service';
import { map } from 'rxjs/operators';

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
    // Cargar preferencia desde BD (si está disponible) antes de resolver la home.
    return homePrefs.syncFromServer(currentUser).pipe(
      map(() => {
        const target = homePrefs.resolveHomeRoute(currentUser);
        console.log('🔐 RoleRedirectGuard: Redirigiendo a home route:', target);
        router.navigate([target]);
        return false;
      })
    );
  }

  return true;
};
