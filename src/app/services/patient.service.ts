import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Patient, ApiResponse, Pagination, PatientFilters } from '../models/patient.model';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private baseUrl = `${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENTS}`;

  constructor(private http: HttpClient) {}

  getAllPatients(filters: PatientFilters = {}, pagination: { page: number, limit: number } = { page: 1, limit: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE }): Observable<ApiResponse<Patient[]>> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());

    // Add filters to params
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof PatientFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<Patient[]>>(`${this.baseUrl}`, { params });
  }

  getPatientById(id: number): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENT_BY_ID(id)}`);
  }

  getPatientByEmail(email: string): Observable<ApiResponse<Patient>> {
    // Codificar el email para la URL (especialmente el símbolo @)
    const encodedEmail = encodeURIComponent(email);
    return this.http.get<ApiResponse<Patient>>(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENT_BY_EMAIL(encodedEmail)}`);
  }

  checkEmailAvailability(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.baseUrl}/check-email`, {
      params: { email }
    });
  }

  createPatient(patient: Omit<Patient, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(`${this.baseUrl}`, patient);
  }

  updatePatient(id: number, patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENT_BY_ID(id)}`, patient);
  }

  deletePatient(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENT_BY_ID(id)}`);
  }

  searchPatients(name: string): Observable<ApiResponse<Patient[]>> {
    return this.http.get<ApiResponse<Patient[]>>(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENT_SEARCH}`, {
      params: { name }
    });
  }

  searchPatientsByCedula(cedula: string): Observable<ApiResponse<Patient[]>> {
    return this.http.get<ApiResponse<Patient[]>>(`${this.baseUrl}/search-cedula`, {
      params: { cedula }
    });
  }

  getPatientsByAgeRange(minAge: number, maxAge: number): Observable<ApiResponse<Patient[]>> {
    return this.http.get<ApiResponse<Patient[]>>(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENT_AGE_RANGE}`, {
      params: { minAge: minAge.toString(), maxAge: maxAge.toString() }
    });
  }

  // Verificar si un paciente tiene consultas asociadas
  hasConsultations(patientId: number): Observable<ApiResponse<{ hasConsultations: boolean }>> {
    return this.http.get<ApiResponse<{ hasConsultations: boolean }>>(`${this.baseUrl}/${patientId}/has-consultations`);
  }

  // Cambiar estado activo/inactivo del paciente
  togglePatientStatus(patientId: number, activo: boolean): Observable<ApiResponse<Patient>> {
    return this.http.patch<ApiResponse<Patient>>(`${this.baseUrl}/${patientId}/toggle-status`, { activo });
  }

  getPatientStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.API_ENDPOINTS.PATIENT_STATISTICS}`);
  }

  getPatientsByMedico(medicoId: number, page: number = 1, limit: number = 100, filters: any = {}): Observable<ApiResponse<{ patients: Patient[], total: number, page: number, limit: number, totalPages: number }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Add filters to params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<ApiResponse<{ patients: Patient[], total: number, page: number, limit: number, totalPages: number }>>(`${this.baseUrl}/by-medico/${medicoId}`, { params });
  }

  // Método específico para estadísticas (sin paginación)
  getPatientsByMedicoForStats(medicoId: number | null): Observable<Patient[]> {
    console.log('🔍 PatientService.getPatientsByMedicoForStats called with medicoId:', medicoId);
    
    if (medicoId === null) {
      // For admin, get all patients
      console.log('👑 Calling admin stats endpoint');
      return this.http.get<ApiResponse<Patient[]>>(`${this.baseUrl}/stats`).pipe(
        map(response => {
          console.log('👑 Admin stats response:', response);
          return response.success ? response.data : [];
        })
      );
    } else {
      // For doctor, get their patients
      console.log('👨‍⚕️ Calling doctor stats endpoint for medicoId:', medicoId);
      return this.http.get<ApiResponse<Patient[]>>(`${this.baseUrl}/by-medico/${medicoId}/stats`).pipe(
        map(response => {
          console.log('👨‍⚕️ Doctor stats response:', response);
          return response.success ? response.data : [];
        })
      );
    }
  }
}
