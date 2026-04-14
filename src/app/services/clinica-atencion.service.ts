import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/patient.model';

export interface ClinicaAtencion {
  id: number;
  nombre_clinica: string;
  direccion_clinica: string | null;
  /** WGS84; opcional. Con longitud se envía enlace a mapas en correos de consulta. */
  latitud?: number | null;
  longitud?: number | null;
  logo_path: string | null;
  logo_path_recipe: string | null;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClinicaAtencionService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/clinica-atencion`;

  constructor(private http: HttpClient) {}

  list(activosOnly: boolean = true): Observable<ApiResponse<ClinicaAtencion[]>> {
    const params = activosOnly ? {} : { activosOnly: 'false' };
    return this.http.get<ApiResponse<ClinicaAtencion[]>>(this.baseUrl, { params: params as any });
  }

  getById(id: number): Observable<ApiResponse<ClinicaAtencion>> {
    return this.http.get<ApiResponse<ClinicaAtencion>>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<ClinicaAtencion>): Observable<ApiResponse<ClinicaAtencion>> {
    return this.http.post<ApiResponse<ClinicaAtencion>>(this.baseUrl, data);
  }

  update(id: number, data: Partial<ClinicaAtencion>): Observable<ApiResponse<ClinicaAtencion>> {
    return this.http.put<ApiResponse<ClinicaAtencion>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
