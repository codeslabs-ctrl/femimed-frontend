import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Servicio {
  id: number;
  nombre_servicio: string;
  especialidad_id: number;
  monto_base: number;
  moneda: 'VES' | 'USD' | 'EUR' | 'COP';
  activo: boolean;
  created_at: string;
  updated_at: string;
  especialidad_nombre?: string;
  especialidades?: {
    id: number;
    nombre_especialidad: string;
    descripcion?: string;
  };
}

export interface ServicioConsulta {
  id: number;
  consulta_id: number;
  servicio_id: number;
  monto_pagado: number;
  moneda: 'VES' | 'USD' | 'EUR' | 'COP';
  observaciones?: string;
  created_at: string;
  servicio_nombre?: string;
}

export interface FinalizarConsultaRequest {
  servicios: {
    servicio_id: number;
    monto_pagado: number;
    moneda: 'VES' | 'USD' | 'EUR' | 'COP';
    observaciones?: string;
  }[];
}

export interface FinalizarConsultaResponse {
  success: boolean;
  message: string;
  data: {
    consulta_id: number;
    total_servicios: number;
    total_monto: number;
    moneda_principal: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private apiUrl = `${environment.apiUrl}/servicios`;

  constructor(private http: HttpClient) {}

  // Obtener todos los servicios
  getServicios(): Observable<{ success: boolean; data: Servicio[] }> {
    const timestamp = new Date().getTime();
    return this.http.get<{ success: boolean; data: Servicio[] }>(`${this.apiUrl}?t=${timestamp}`);
  }

  // Obtener servicios por especialidad
  getServiciosPorEspecialidad(especialidadId: number): Observable<{ success: boolean; data: Servicio[] }> {
    return this.http.get<{ success: boolean; data: Servicio[] }>(`${this.apiUrl}/especialidad/${especialidadId}`);
  }

  // Crear servicio
  crearServicio(servicio: Partial<Servicio>): Observable<{ success: boolean; data: Servicio }> {
    return this.http.post<{ success: boolean; data: Servicio }>(this.apiUrl, servicio);
  }

  // Actualizar servicio
  actualizarServicio(id: number, servicio: Partial<Servicio>): Observable<{ success: boolean; data: Servicio }> {
    return this.http.put<{ success: boolean; data: Servicio }>(`${this.apiUrl}/${id}`, servicio);
  }

  // Eliminar servicio
  eliminarServicio(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Finalizar consulta con servicios
  finalizarConsultaConServicios(consultaId: number, data: FinalizarConsultaRequest): Observable<FinalizarConsultaResponse> {
    return this.http.post<FinalizarConsultaResponse>(`${environment.apiUrl}/consultas/${consultaId}/finalizar-con-servicios`, data);
  }

  // Obtener servicios de una consulta
  getServiciosConsulta(consultaId: number): Observable<{ success: boolean; data: ServicioConsulta[] }> {
    return this.http.get<{ success: boolean; data: ServicioConsulta[] }>(`${environment.apiUrl}/consultas/${consultaId}/servicios`);
  }

  // Obtener totales de una consulta
  getTotalesConsulta(consultaId: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${environment.apiUrl}/consultas/${consultaId}/totales`);
  }

  // Obtener detalle de finalización
  getDetalleFinalizacion(consultaId: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${environment.apiUrl}/consultas/${consultaId}/detalle-finalizacion`);
  }
}
