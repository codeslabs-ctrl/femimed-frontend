import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/patient.model';

export interface HistoricoData {
  id: number;
  paciente_id: number;
  medico_id: number;
  motivo_consulta: string;
  diagnostico?: string;
  conclusiones?: string;
  plan?: string;
  antecedentes_personales?: string;
  antecedentes_familiares?: string;
  antecedentes_quirurgicos?: string;
  antecedentes_otros?: string;
  fecha_consulta: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ruta_archivo?: string;
  nombre_archivo?: string;
}

export interface HistoricoWithDetails extends HistoricoData {
  paciente_nombre?: string;
  paciente_apellidos?: string;
  medico_nombre?: string;
  medico_apellidos?: string;
  nombre_medico?: string; // Field that actually comes from the backend
  especialidad_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoricoService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/historico`;

  constructor(private http: HttpClient) {}

  // Obtener historial por paciente
  getHistoricoByPaciente(pacienteId: number): Observable<ApiResponse<HistoricoWithDetails[]>> {
    return this.http.get<ApiResponse<HistoricoWithDetails[]>>(`${this.baseUrl}/by-paciente/${pacienteId}`);
  }

  // Obtener el historial más reciente por paciente
  getLatestHistoricoByPaciente(pacienteId: number): Observable<ApiResponse<HistoricoWithDetails>> {
    return this.http.get<ApiResponse<HistoricoWithDetails>>(`${this.baseUrl}/by-paciente/${pacienteId}/latest`);
  }

  // Obtener historial por médico
  getHistoricoByMedico(medicoId: number): Observable<ApiResponse<HistoricoWithDetails[]>> {
    return this.http.get<ApiResponse<HistoricoWithDetails[]>>(`${this.baseUrl}/by-medico/${medicoId}`);
  }

  // Obtener historial por ID
  getHistoricoById(historicoId: number): Observable<ApiResponse<HistoricoWithDetails>> {
    return this.http.get<ApiResponse<HistoricoWithDetails>>(`${this.baseUrl}/${historicoId}`);
  }

  // Obtener historial completo
  getHistoricoCompleto(): Observable<ApiResponse<HistoricoWithDetails[]>> {
    return this.http.get<ApiResponse<HistoricoWithDetails[]>>(this.baseUrl);
  }

  // Obtener médicos que han creado historias para un paciente
  getMedicosConHistoriaByPaciente(pacienteId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/by-paciente/${pacienteId}/medicos`);
  }

  // Obtener historia específica de un médico para un paciente
  getHistoricoByPacienteAndMedico(pacienteId: number, medicoId: number): Observable<ApiResponse<HistoricoWithDetails>> {
    return this.http.get<ApiResponse<HistoricoWithDetails>>(`${this.baseUrl}/by-paciente/${pacienteId}/medico/${medicoId}`);
  }

  // Obtener historial filtrado
  getHistoricoFiltrado(pacienteId?: number, medicoId?: number): Observable<ApiResponse<HistoricoWithDetails[]>> {
    let params = new HttpParams();
    
    if (pacienteId) {
      params = params.set('paciente_id', pacienteId.toString());
    }
    
    if (medicoId) {
      params = params.set('medico_id', medicoId.toString());
    }

    return this.http.get<ApiResponse<HistoricoWithDetails[]>>(`${this.baseUrl}/filtrado`, { params });
  }

  // Crear nuevo historial médico
  createHistorico(historicoData: Omit<HistoricoData, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<ApiResponse<HistoricoWithDetails>> {
    return this.http.post<ApiResponse<HistoricoWithDetails>>(`${this.baseUrl}`, historicoData);
  }

  // Actualizar historial médico
  updateHistorico(historicoId: number, updateData: Partial<HistoricoData>): Observable<ApiResponse<HistoricoWithDetails>> {
    return this.http.put<ApiResponse<HistoricoWithDetails>>(`${this.baseUrl}/${historicoId}`, updateData);
  }

  // Verificar si un paciente tiene historia médica para una especialidad
  verificarHistoriaPorEspecialidad(pacienteId: number, especialidadId: number): Observable<ApiResponse<{ tiene_historia: boolean; paciente_id: number; especialidad_id: number }>> {
    return this.http.get<ApiResponse<{ tiene_historia: boolean; paciente_id: number; especialidad_id: number }>>(
      `${this.baseUrl}/by-paciente/${pacienteId}/verificar-especialidad`,
      { params: { especialidad_id: especialidadId.toString() } }
    );
  }
}
