import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class InformeMedicoGuard implements CanActivate {
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

    // Verificar permisos específicos según la ruta
    const url = state.url;
    
    // Rutas que requieren rol de administrador
    const adminOnlyRoutes = [
      '/admin/informes-medicos/templates',
      '/admin/informes-medicos/estadisticas',
      '/admin/informes-medicos/configuracion'
    ];
    
    // Rutas que requieren rol de médico o administrador
    const medicoOrAdminRoutes = [
      '/admin/informes-medicos',
      '/admin/informes-medicos/lista',
      '/admin/informes-medicos/nuevo',
      '/admin/informes-medicos/:id',
      '/admin/informes-medicos/:id/editar',
      '/admin/informes-medicos/:id/firmar',
      '/admin/informes-medicos/:id/enviar'
    ];

    // Verificar si la ruta requiere permisos de administrador
    if (adminOnlyRoutes.some(route => url.includes(route.replace('/admin/informes-medicos', '')))) {
      if (currentUser.rol !== 'administrador') {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    // Verificar si la ruta requiere permisos de médico, administrador o secretaria
    if (medicoOrAdminRoutes.some(route => url.includes(route.replace('/admin/informes-medicos', '')))) {
      if (currentUser.rol !== 'medico' && currentUser.rol !== 'administrador' && currentUser.rol !== 'secretaria') {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    // Verificaciones específicas por acción
    if (url.includes('/firmar')) {
      // Solo médicos pueden firmar informes
      if (currentUser.rol !== 'medico' && currentUser.rol !== 'administrador') {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    if (url.includes('/enviar')) {
      // Solo administradores pueden enviar informes
      if (currentUser.rol !== 'administrador') {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class InformeMedicoAdminGuard implements CanActivate {
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

    // Solo administradores pueden acceder
    if (currentUser.rol !== 'administrador') {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class InformeMedicoMedicoGuard implements CanActivate {
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

    // Solo médicos, administradores y secretarias pueden acceder
    if (currentUser.rol !== 'medico' && currentUser.rol !== 'administrador' && currentUser.rol !== 'secretaria') {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}



