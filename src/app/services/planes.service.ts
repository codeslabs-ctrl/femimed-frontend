import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';

/** Plan desde la tabla planes_comparativos (orden por campo orden). */
export interface PlanComparativo {
  id: number;
  plan: string;
  costo_base: string | null;
  medicos_incluidos: string | null;
  pacientes_incluidos: string | null;
  almacenamiento: string | null;
  orden: number;
}

/** Fila de add-on desde la tabla addons_progresivos. */
export interface AddonProgresivoRow {
  id: number;
  complemento: string;
  en_plan_profesional: string | null;
  en_plan_clinica_core: string | null;
  en_plan_clinica_pro: string | null;
  orden: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string };
}

@Injectable({ providedIn: 'root' })
export class PlanesService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/planes`;

  constructor(private http: HttpClient) {}

  getPlanesComparativa(): Observable<ApiResponse<PlanComparativo[]>> {
    return this.http.get<ApiResponse<PlanComparativo[]>>(`${this.baseUrl}/comparativa`);
  }

  getAddonsProgresivos(): Observable<ApiResponse<AddonProgresivoRow[]>> {
    return this.http.get<ApiResponse<AddonProgresivoRow[]>>(`${this.baseUrl}/addons`);
  }

  solicitarUsuarioPruebas(data: { nombre: string; apellido: string; email: string; telefono?: string; especialidad_id: number; mensaje?: string }): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.baseUrl}/solicitud-demo`, data);
  }
}
