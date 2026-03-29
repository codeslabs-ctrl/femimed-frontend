import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/patient.model';

export interface Medico {
  id?: number;
  nombres: string;
  apellidos: string;
  cedula?: string;
  email: string;
  telefono: string;
  especialidad_id: number;
  especialidad_nombre?: string;
  /** Masculino | Femenino — para título Dr. / Dra. */
  sexo?: string | null;
  mpps?: string;
  cm?: string;
  /** Texto libre: especialidades/titulación para récipe e informes */
  titulacion?: string | null;
  /** Texto libre: WhatsApp, Instagram, etc. para récipe e informes */
  contacto_redes?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  firma_digital?: string;
  sello_humedo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/medicos`;

  constructor(private http: HttpClient) {}

  getAllMedicos(): Observable<ApiResponse<Medico[]>> {
    return this.http.get<ApiResponse<Medico[]>>(this.baseUrl);
  }

  getMedicoById(id: number): Observable<ApiResponse<Medico>> {
    return this.http.get<ApiResponse<Medico>>(`${this.baseUrl}/${id}`);
  }

  createMedico(medico: Omit<Medico, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<ApiResponse<Medico>> {
    return this.http.post<ApiResponse<Medico>>(this.baseUrl, medico);
  }

  updateMedico(id: number, medico: Partial<Medico>): Observable<ApiResponse<Medico>> {
    return this.http.put<ApiResponse<Medico>>(`${this.baseUrl}/${id}`, medico);
  }

  deleteMedico(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`);
  }

  searchMedicos(query: string): Observable<ApiResponse<Medico[]>> {
    return this.http.get<ApiResponse<Medico[]>>(`${this.baseUrl}/search`, {
      params: { q: query }
    });
  }

  getMedicosByEspecialidad(especialidadId: number): Observable<ApiResponse<Medico[]>> {
    return this.http.get<ApiResponse<Medico[]>>(`${this.baseUrl}/by-especialidad/${especialidadId}`);
  }
}