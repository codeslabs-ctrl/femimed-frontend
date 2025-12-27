import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

export type HomeRoute =
  | '/dashboard'
  | '/patients'
  | '/admin/consultas'
  | '/admin/informes-medicos'
  | '/admin/finanzas';

export interface HomeOption {
  label: string;
  route: HomeRoute;
}

interface StoredPreferencesByUserId {
  [userId: string]: {
    homeRoute?: HomeRoute;
    updatedAt?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class HomePreferencesService {
  private readonly STORAGE_KEY = APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES;
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getAllowedHomeOptions(user: User | null): HomeOption[] {
    if (!user?.rol) return [{ label: 'Dashboard', route: '/dashboard' }];

    switch (user.rol) {
      case 'finanzas':
        return [{ label: 'Panel de Finanzas', route: '/admin/finanzas' }];
      case 'medico':
      case 'secretaria':
      case 'administrador':
        return [
          { label: 'Dashboard', route: '/dashboard' },
          { label: 'Gestión de Consultas', route: '/admin/consultas' },
          { label: 'Gestión de Pacientes', route: '/patients' },
          { label: 'Informes Médicos', route: '/admin/informes-medicos' }
        ];
      default:
        return [{ label: 'Dashboard', route: '/dashboard' }];
    }
  }

  canChooseHome(user: User | null): boolean {
    return this.getAllowedHomeOptions(user).length > 1;
  }

  getPreferredHomeRoute(user: User | null): HomeRoute | null {
    if (!user?.id) return null;
    const store = this.readStore();
    return store[String(user.id)]?.homeRoute || null;
  }

  setPreferredHomeRoute(user: User, route: HomeRoute): void {
    const allowed = this.getAllowedHomeOptions(user).map(o => o.route);
    if (!allowed.includes(route)) {
      // No guardar rutas a las que el usuario no tiene acceso.
      return;
    }

    const store = this.readStore();
    store[String(user.id)] = {
      ...store[String(user.id)],
      homeRoute: route,
      updatedAt: new Date().toISOString()
    };
    this.writeStore(store);
  }

  /**
   * Carga preferencias desde backend y actualiza el cache local.
   * Si falla, no rompe el flujo: simplemente no actualiza nada.
   */
  syncFromServer(user: User | null) {
    if (!user?.id) return of(null);
    const token = localStorage.getItem('femimed_token');
    if (!token) return of(null);

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<any>(`${this.API_URL}/users/me/preferences`, { headers }).pipe(
      map(resp => (resp?.success ? resp?.data?.preferences : null) as Record<string, any> | null),
      tap((prefs) => {
        if (!prefs) return;
        const home = prefs['pagina_principal'];
        if (typeof home === 'string') {
          // Solo guardar si es una ruta permitida para el rol.
          this.setPreferredHomeRoute(user, home as HomeRoute);
        }
      }),
      map(() => true),
      catchError(() => of(null))
    );
  }

  /**
   * Guarda la home en backend (BD) y actualiza cache local.
   */
  saveHomeRouteToServer(user: User, route: HomeRoute) {
    const token = localStorage.getItem('femimed_token');
    if (!token) return of(null);

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<any>(`${this.API_URL}/users/me/preferences`, { key: 'pagina_principal', value: route }, { headers }).pipe(
      tap((resp) => {
        if (resp?.success) {
          this.setPreferredHomeRoute(user, route);
        }
      }),
      map(() => true),
      catchError(() => of(null))
    );
  }

  resolveHomeRoute(user: User | null): HomeRoute {
    const allowed = this.getAllowedHomeOptions(user);
    const preferred = this.getPreferredHomeRoute(user);
    if (preferred && allowed.some(o => o.route === preferred)) return preferred;
    return allowed[0]?.route || '/dashboard';
  }

  private readStore(): StoredPreferencesByUserId {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed as StoredPreferencesByUserId;
    } catch {
      return {};
    }
  }

  private writeStore(store: StoredPreferencesByUserId): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
  }
}


