import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';

export interface MenuItem {
  id: number;
  nombre: string;
  icono: string | null;
  ruta: string | null;
  orden: number;
  activo: boolean;
  padre_id: number | null;
  tipo: 'encabezado' | 'opcion';
  es_visible: boolean;
  hijos?: MenuItem[];
}

export interface Perfil {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface PerfilMenuAcceso {
  id: number;
  perfil_id: number;
  menu_item_id: number;
  puede_acceder: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_finalizar: boolean;
  puede_completar: boolean;
  puede_ver_servicios: boolean;
}

export interface PermisosUpdate {
  menu_item_id: number;
  puede_acceder?: boolean;
  puede_crear?: boolean;
  puede_editar?: boolean;
  puede_eliminar?: boolean;
  puede_finalizar?: boolean;
  puede_completar?: boolean;
  puede_ver_servicios?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = `${APP_CONFIG.API_BASE_URL}/menu`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los items del menú (solo admin)
   */
  getMenuItems(): Observable<{ success: boolean; data: MenuItem[] }> {
    return this.http.get<{ success: boolean; data: MenuItem[] }>(`${this.apiUrl}/items`);
  }

  /**
   * Obtiene el menú filtrado por perfil
   */
  getMenuByPerfil(perfilNombre: string): Observable<{ success: boolean; data: MenuItem[] }> {
    return this.http.get<{ success: boolean; data: MenuItem[] }>(`${this.apiUrl}/perfil/${perfilNombre}`);
  }

  /**
   * Obtiene todos los perfiles (solo admin)
   */
  getPerfiles(): Observable<{ success: boolean; data: Perfil[] }> {
    return this.http.get<{ success: boolean; data: Perfil[] }>(`${this.apiUrl}/perfiles`);
  }

  /**
   * Obtiene permisos de un perfil (solo admin)
   */
  getPermisosByPerfil(perfilId: number): Observable<{ success: boolean; data: PerfilMenuAcceso[] }> {
    return this.http.get<{ success: boolean; data: PerfilMenuAcceso[] }>(`${this.apiUrl}/perfiles/${perfilId}/permisos`);
  }

  /**
   * Actualiza permisos de un perfil para un item del menú (solo admin)
   */
  updatePermisos(
    perfilId: number,
    menuItemId: number,
    permisos: Partial<Omit<PerfilMenuAcceso, 'id' | 'perfil_id' | 'menu_item_id'>>
  ): Observable<{ success: boolean; data: PerfilMenuAcceso }> {
    return this.http.put<{ success: boolean; data: PerfilMenuAcceso }>(
      `${this.apiUrl}/perfiles/${perfilId}/permisos/${menuItemId}`,
      permisos
    );
  }

  /**
   * Actualiza múltiples permisos de un perfil (solo admin)
   */
  updatePermisosBulk(
    perfilId: number,
    permisos: PermisosUpdate[]
  ): Observable<{ success: boolean; data: { message: string } }> {
    return this.http.put<{ success: boolean; data: { message: string } }>(
      `${this.apiUrl}/perfiles/${perfilId}/permisos`,
      { permisos }
    );
  }
}

