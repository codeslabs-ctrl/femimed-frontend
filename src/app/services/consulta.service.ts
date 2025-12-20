import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/patient.model';
import { Consulta, ConsultaWithDetails, ConsultaFormData, ConsultaFilters } from '../models/consulta.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/consultas`;

  constructor(private http: HttpClient) {}

  // Obtener todas las consultas con filtros
  getConsultas(filters?: ConsultaFilters): Observable<ApiResponse<ConsultaWithDetails[]>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.paciente_id) params = params.set('paciente_id', filters.paciente_id.toString());
      if (filters.medico_id) params = params.set('medico_id', filters.medico_id.toString());
      if (filters.estado_consulta) params = params.set('estado_consulta', filters.estado_consulta);
      if (filters.fecha_desde) params = params.set('fecha_desde', filters.fecha_desde);
      if (filters.fecha_hasta) params = params.set('fecha_hasta', filters.fecha_hasta);
      if (filters.prioridad) params = params.set('prioridad', filters.prioridad);
      if (filters.tipo_consulta) params = params.set('tipo_consulta', filters.tipo_consulta);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ApiResponse<ConsultaWithDetails[]>>(this.baseUrl, { params });
  }

  // Obtener consulta por ID
  getConsultaById(id: number): Observable<ApiResponse<ConsultaWithDetails>> {
    return this.http.get<ApiResponse<ConsultaWithDetails>>(`${this.baseUrl}/${id}`);
  }

  // Obtener consultas por paciente
  getConsultasByPaciente(pacienteId: number): Observable<ApiResponse<ConsultaWithDetails[]>> {
    return this.http.get<ApiResponse<ConsultaWithDetails[]>>(`${this.baseUrl}/by-paciente/${pacienteId}`);
  }

  // Obtener consultas por médico
  getConsultasByMedico(medicoId: number): Observable<ApiResponse<ConsultaWithDetails[]>> {
    return this.http.get<ApiResponse<ConsultaWithDetails[]>>(`${this.baseUrl}/by-medico/${medicoId}`);
  }

  // Obtener consultas del día
  getConsultasHoy(): Observable<ApiResponse<ConsultaWithDetails[]>> {
    return this.http.get<ApiResponse<ConsultaWithDetails[]>>(`${this.baseUrl}/hoy`);
  }

  // Obtener consultas del día filtradas por usuario autenticado
  getConsultasDelDia(): Observable<ApiResponse<ConsultaWithDetails[]>> {
    return this.http.get<ApiResponse<ConsultaWithDetails[]>>(`${this.baseUrl}/del-dia`);
  }

  // Obtener consultas pendientes
  getConsultasPendientes(): Observable<ApiResponse<ConsultaWithDetails[]>> {
    return this.http.get<ApiResponse<ConsultaWithDetails[]>>(`${this.baseUrl}/pendientes`);
  }

  // Crear nueva consulta
  createConsulta(consulta: ConsultaFormData): Observable<ApiResponse<Consulta>> {
    return this.http.post<ApiResponse<Consulta>>(this.baseUrl, consulta);
  }

  // Actualizar consulta
  updateConsulta(id: number, consulta: Partial<ConsultaFormData>): Observable<ApiResponse<Consulta>> {
    return this.http.put<ApiResponse<Consulta>>(`${this.baseUrl}/${id}`, consulta);
  }

  // Cancelar consulta
  cancelarConsulta(id: number, motivo: string): Observable<ApiResponse<Consulta>> {
    return this.http.put<ApiResponse<Consulta>>(`${this.baseUrl}/${id}/cancelar`, { motivo_cancelacion: motivo });
  }

  // Finalizar consulta
  finalizarConsulta(id: number, datos: { diagnostico_preliminar?: string; observaciones?: string }): Observable<ApiResponse<Consulta>> {
    return this.http.put<ApiResponse<Consulta>>(`${this.baseUrl}/${id}/finalizar`, datos);
  }

  // Reagendar consulta
  reagendarConsulta(id: number, nuevaFecha: string, nuevaHora: string): Observable<ApiResponse<Consulta>> {
    return this.http.put<ApiResponse<Consulta>>(`${this.baseUrl}/${id}/reagendar`, {
      fecha_pautada: nuevaFecha,
      hora_pautada: nuevaHora
    });
  }

  // Eliminar consulta
  deleteConsulta(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  // Buscar consultas
  searchConsultas(query: string): Observable<ApiResponse<ConsultaWithDetails[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<ConsultaWithDetails[]>>(`${this.baseUrl}/search`, { params });
  }

  // Obtener estadísticas de consultas
  getEstadisticasConsultas(): Observable<ApiResponse<{
    total: number;
    agendadas: number;
    finalizadas: number;
    canceladas: number;
    hoy: number;
    por_estado: { estado: string; cantidad: number }[];
    por_prioridad: { prioridad: string; cantidad: number }[];
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/estadisticas`);
  }

  // Obtener estadísticas de consultas por período
  getEstadisticasPorPeriodo(fechaInicio: string, fechaFin: string): Observable<ApiResponse<{ estado: string; total: number }[]>> {
    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);
    
    return this.http.get<ApiResponse<{ estado: string; total: number }[]>>(`${this.baseUrl}/estadisticas-por-periodo`, { params });
  }

  // Obtener estadísticas de consultas por especialidad
  getEstadisticasPorEspecialidad(fechaInicio: string, fechaFin: string): Observable<ApiResponse<{ especialidad: string; total: number }[]>> {
    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);
    
    return this.http.get<ApiResponse<{ especialidad: string; total: number }[]>>(`${this.baseUrl}/estadisticas-por-especialidad`, { params });
  }

  getEstadisticasPorMedico(fechaInicio: string, fechaFin: string): Observable<ApiResponse<{ medico: string; total: number }[]>> {
    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);
    
    return this.http.get<ApiResponse<{ medico: string; total: number }[]>>(`${this.baseUrl}/estadisticas-por-medico`, { params });
  }
}
