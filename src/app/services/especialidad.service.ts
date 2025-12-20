import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/patient.model';

export interface Especialidad {
  id?: number;
  nombre_especialidad: string;
  descripcion: string;
  activa?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/especialidades`;

  constructor(private http: HttpClient) {}

  getAllEspecialidades(): Observable<ApiResponse<Especialidad[]>> {
    return this.http.get<ApiResponse<Especialidad[]>>(this.baseUrl);
  }

  getEspecialidadById(id: number): Observable<ApiResponse<Especialidad>> {
    return this.http.get<ApiResponse<Especialidad>>(`${this.baseUrl}/${id}`);
  }

  createEspecialidad(especialidad: Omit<Especialidad, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<ApiResponse<Especialidad>> {
    return this.http.post<ApiResponse<Especialidad>>(this.baseUrl, especialidad);
  }

  updateEspecialidad(id: number, especialidad: Partial<Especialidad>): Observable<ApiResponse<Especialidad>> {
    return this.http.put<ApiResponse<Especialidad>>(`${this.baseUrl}/${id}`, especialidad);
  }

  deleteEspecialidad(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`);
  }

  searchEspecialidades(query: string): Observable<ApiResponse<Especialidad[]>> {
    return this.http.get<ApiResponse<Especialidad[]>>(`${this.baseUrl}/search`, {
      params: { q: query }
    });
  }
}
