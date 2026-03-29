import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

type PreferencesResponse = { success: boolean; data?: { preferences?: Record<string, any> }; error?: { message?: string } };
type UpdatePreferenceResponse = { success: boolean; data?: any; error?: { message?: string } };

@Injectable({ providedIn: 'root' })
export class HomePreferencesService {
  private readonly API_URL = `${environment.apiUrl}`;

  // Cache simple por usuario (evita pedir en cada guard)
  private cache: Record<number, string | null> = {};

  private allowedRoutesByRole: Record<string, Array<{ label: string; route: string }>> = {
    finanzas: [{ label: 'Panel de Finanzas', route: '/admin/finanzas' }],
    medico: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Gestión de Pacientes', route: '/patients' },
      { label: 'Gestión de Consultas', route: '/admin/consultas' },
      { label: 'Informes Médicos', route: '/admin/informes-medicos' },
      { label: 'Panel de Finanzas', route: '/admin/finanzas' }
    ],
    secretaria: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Gestión de Pacientes', route: '/patients' },
      { label: 'Gestión de Consultas', route: '/admin/consultas' },
      { label: 'Informes Médicos', route: '/admin/informes-medicos' }
    ],
    administrador: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Gestión de Pacientes', route: '/patients' },
      { label: 'Gestión de Consultas', route: '/admin/consultas' },
      { label: 'Informes Médicos', route: '/admin/informes-medicos' },
      { label: 'Mensajes', route: '/admin/mensajes' },
      { label: 'Estadísticas', route: '/statistics' }
    ]
  };

  constructor(private http: HttpClient) {}

  getAllowedHomesForRole(role: string | undefined | null): Array<{ label: string; route: string }> {
    if (!role) return [{ label: 'Dashboard', route: '/dashboard' }];
    return this.allowedRoutesByRole[role] || [{ label: 'Dashboard', route: '/dashboard' }];
  }

  getDefaultHomeForRole(role: string | undefined | null): string {
    if (role === 'finanzas') return '/admin/finanzas';
    return '/dashboard';
  }

  getPreferredHomeRoute(user: User | null): Observable<string> {
    if (!user?.id) return of(this.getDefaultHomeForRole(user?.rol));

    const cached = this.cache[user.id];
    if (cached) return of(cached);

    return this.http.get<PreferencesResponse>(`${this.API_URL}/users/me/preferences`).pipe(
      map(resp => {
        const saved = resp?.data?.preferences?.['pagina_principal'];
        const route = typeof saved === 'string' ? saved : null;
        const allowed = this.getAllowedHomesForRole(user.rol).map(x => x.route);
        if (route && allowed.includes(route)) return route;
        return this.getDefaultHomeForRole(user.rol);
      }),
      tap(route => {
        this.cache[user.id] = route;
      }),
      catchError(() => of(this.getDefaultHomeForRole(user.rol)))
    );
  }

  setPreferredHomeRoute(route: string): Observable<boolean> {
    return this.http.put<UpdatePreferenceResponse>(`${this.API_URL}/users/me/preferences`, { key: 'pagina_principal', value: route }).pipe(
      map(resp => !!resp?.success),
      catchError(() => of(false))
    );
  }
}


