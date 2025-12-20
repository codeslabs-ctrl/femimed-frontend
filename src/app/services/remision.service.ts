import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { 
  Remision, 
  RemisionWithDetails, 
  CreateRemisionRequest, 
  CrearRemisionRequest,
  UpdateRemisionStatusRequest,
  RemisionStatistics 
} from '../models/remision.model';
import { ApiResponse } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class RemisionService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/remisiones`;

  constructor(private http: HttpClient) {}

  // Crear nueva remisión
  createRemision(remisionData: CreateRemisionRequest): Observable<ApiResponse<Remision>> {
    return this.http.post<ApiResponse<Remision>>(this.baseUrl, remisionData);
  }

  // Crear nueva remisión (método en español)
  crearRemision(remisionData: CrearRemisionRequest): Observable<ApiResponse<Remision>> {
    return this.http.post<ApiResponse<Remision>>(this.baseUrl, remisionData);
  }

  // Actualizar estado de remisión
  updateRemisionStatus(id: number, statusData: UpdateRemisionStatusRequest): Observable<ApiResponse<Remision>> {
    return this.http.put<ApiResponse<Remision>>(`${this.baseUrl}/${id}/status`, statusData);
  }

  // Obtener todas las remisiones
  getAllRemisiones(): Observable<ApiResponse<RemisionWithDetails[]>> {
    return this.http.get<ApiResponse<RemisionWithDetails[]>>(this.baseUrl);
  }

  // Obtener remisión por ID
  getRemisionById(id: number): Observable<ApiResponse<RemisionWithDetails>> {
    return this.http.get<ApiResponse<RemisionWithDetails>>(`${this.baseUrl}/${id}`);
  }

  // Obtener remisiones por médico
  getRemisionesByMedico(medicoId: number, tipo: 'remitente' | 'remitido' = 'remitente'): Observable<ApiResponse<RemisionWithDetails[]>> {
    let params = new HttpParams()
      .set('medico_id', medicoId.toString())
      .set('tipo', tipo);

    return this.http.get<ApiResponse<RemisionWithDetails[]>>(`${this.baseUrl}/by-medico`, { params });
  }

  // Obtener remisiones por paciente
  getRemisionesByPaciente(pacienteId: number): Observable<ApiResponse<RemisionWithDetails[]>> {
    return this.http.get<ApiResponse<RemisionWithDetails[]>>(`${this.baseUrl}/by-paciente/${pacienteId}`);
  }

  // Obtener remisiones por estado
  getRemisionesByStatus(estado: string): Observable<ApiResponse<RemisionWithDetails[]>> {
    let params = new HttpParams().set('estado', estado);
    return this.http.get<ApiResponse<RemisionWithDetails[]>>(`${this.baseUrl}/by-status`, { params });
  }

  // Obtener estadísticas de remisiones
  getRemisionesStatistics(): Observable<ApiResponse<RemisionStatistics>> {
    return this.http.get<ApiResponse<RemisionStatistics>>(`${this.baseUrl}/statistics`);
  }

  // Obtener remisiones pendientes
  getRemisionesPendientes(): Observable<ApiResponse<RemisionWithDetails[]>> {
    return this.getRemisionesByStatus('Pendiente');
  }

  // Obtener remisiones aceptadas
  getRemisionesAceptadas(): Observable<ApiResponse<RemisionWithDetails[]>> {
    return this.getRemisionesByStatus('Aceptada');
  }

  // Obtener remisiones rechazadas
  getRemisionesRechazadas(): Observable<ApiResponse<RemisionWithDetails[]>> {
    return this.getRemisionesByStatus('Rechazada');
  }

  // Obtener remisiones completadas
  getRemisionesCompletadas(): Observable<ApiResponse<RemisionWithDetails[]>> {
    return this.getRemisionesByStatus('Completada');
  }
}
