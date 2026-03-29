import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/patient.model';
import { AntecedenteMedicoTipo, AntecedenteTipoEnum } from '../models/antecedente-tipo.model';

@Injectable({
  providedIn: 'root'
})
export class AntecedenteTipoService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}/antecedentes-tipo`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<AntecedenteMedicoTipo[]>> {
    return this.http.get<ApiResponse<AntecedenteMedicoTipo[]>>(this.baseUrl);
  }

  getByTipo(tipo: AntecedenteTipoEnum, soloActivos = true): Observable<ApiResponse<AntecedenteMedicoTipo[]>> {
    let params = new HttpParams().set('tipo', tipo);
    if (soloActivos) params = params.set('activo', 'true');
    return this.http.get<ApiResponse<AntecedenteMedicoTipo[]>>(`${this.baseUrl}/por-tipo`, { params });
  }

  getActivos(): Observable<ApiResponse<AntecedenteMedicoTipo[]>> {
    return this.http.get<ApiResponse<AntecedenteMedicoTipo[]>>(`${this.baseUrl}`, {
      params: { activo: 'true' }
    });
  }

  getById(id: number): Observable<ApiResponse<AntecedenteMedicoTipo>> {
    return this.http.get<ApiResponse<AntecedenteMedicoTipo>>(`${this.baseUrl}/${id}`);
  }

  create(item: Omit<AntecedenteMedicoTipo, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<ApiResponse<AntecedenteMedicoTipo>> {
    return this.http.post<ApiResponse<AntecedenteMedicoTipo>>(this.baseUrl, item);
  }

  update(id: number, item: Partial<AntecedenteMedicoTipo>): Observable<ApiResponse<AntecedenteMedicoTipo>> {
    return this.http.put<ApiResponse<AntecedenteMedicoTipo>>(`${this.baseUrl}/${id}`, item);
  }

  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`);
  }
}
