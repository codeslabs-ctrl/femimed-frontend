import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/patient.model';
import { HistoricoAntecedente, AntecedentesResponse } from '../models/historico-antecedente.model';

@Injectable({
  providedIn: 'root'
})
export class HistoricoAntecedenteService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/historico`;
  private patientsUrl = `${APP_CONFIG.API_BASE_URL}/patients`;

  constructor(private http: HttpClient) {}

  getByHistoricoId(historicoId: number): Observable<ApiResponse<AntecedentesResponse>> {
    return this.http.get<ApiResponse<AntecedentesResponse>>(`${this.baseUrl}/${historicoId}/antecedentes`);
  }

  getByPacienteId(pacienteId: number): Observable<ApiResponse<AntecedentesResponse>> {
    return this.http.get<ApiResponse<AntecedentesResponse>>(`${this.patientsUrl}/${pacienteId}/antecedentes`);
  }

  saveBulk(
    historicoId: number,
    items: HistoricoAntecedente[],
    antecedentes_otros?: string | null
  ): Observable<ApiResponse<AntecedentesResponse>> {
    const body: { antecedentes: HistoricoAntecedente[]; antecedentes_otros?: string | null } = { antecedentes: items };
    if (antecedentes_otros !== undefined) body.antecedentes_otros = antecedentes_otros;
    return this.http.put<ApiResponse<AntecedentesResponse>>(`${this.baseUrl}/${historicoId}/antecedentes`, body);
  }

  saveByPacienteId(
    pacienteId: number,
    items: HistoricoAntecedente[],
    antecedentes_otros?: string | null
  ): Observable<ApiResponse<AntecedentesResponse>> {
    const body: { antecedentes: HistoricoAntecedente[]; antecedentes_otros?: string | null } = { antecedentes: items };
    if (antecedentes_otros !== undefined) body.antecedentes_otros = antecedentes_otros;
    return this.http.put<ApiResponse<AntecedentesResponse>>(`${this.patientsUrl}/${pacienteId}/antecedentes`, body);
  }
}
