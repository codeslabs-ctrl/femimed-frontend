import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EstadisticasEspecialidad {
  id_especialidad: number;
  nombre_especialidad: string;
  medicos_activos: number;
  total_consultas: number;
  pacientes_atendidos: number;
}

export interface MedicoCompleto {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  especialidad_id: number;
  especialidad_nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ViewsService {
  private baseUrl = `${environment.apiUrl}/views`;

  constructor(private http: HttpClient) {}

  getEstadisticasEspecialidad(especialidadId?: number): Observable<ApiResponse<EstadisticasEspecialidad[]>> {
    let params = new HttpParams();
    if (especialidadId) {
      params = params.set('especialidad_id', especialidadId.toString());
    }
    
    return this.http.get<ApiResponse<EstadisticasEspecialidad[]>>(`${this.baseUrl}/estadisticas-especialidad`, { params });
  }

  getMedicosCompleta(filters: any = {}, pagination: any = {}): Observable<ApiResponse<MedicoCompleto[]>> {
    let params = new HttpParams();
    
    // Agregar filtros
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.set(key, filters[key].toString());
      }
    });
    
    // Agregar paginación
    Object.keys(pagination).forEach(key => {
      if (pagination[key] !== null && pagination[key] !== undefined) {
        params = params.set(key, pagination[key].toString());
      }
    });
    
    return this.http.get<ApiResponse<MedicoCompleto[]>>(`${this.baseUrl}/medicos-completa`, { params });
  }
}
