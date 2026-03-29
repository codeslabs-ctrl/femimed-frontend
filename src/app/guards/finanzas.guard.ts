import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class FinanzasGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    // Usuarios con rol finanzas, administrador o médico pueden acceder
    if (currentUser.rol !== 'finanzas' && currentUser.rol !== 'administrador' && currentUser.rol !== 'medico') {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}

