import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FirmaResponse {
  success: boolean;
  data?: {
    firma_digital: string;
  };
  error?: {
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FirmaService {
  private apiUrl = `${environment.apiUrl}/firmas`;

  constructor(private http: HttpClient) {}

  /**
   * Subir firma digital de un médico
   * @param medicoId ID del médico
   * @param firmaFile Archivo de la firma
   * @returns Observable con la respuesta
   */
  subirFirma(medicoId: number, firmaFile: File): Observable<FirmaResponse> {
    const formData = new FormData();
    formData.append('firma', firmaFile);

    return this.http.post<FirmaResponse>(`${this.apiUrl}/${medicoId}/subir`, formData);
  }

  /**
   * Obtener la ruta de la firma digital de un médico
   * @param medicoId ID del médico
   * @returns Observable con la respuesta
   */
  obtenerFirma(medicoId: number): Observable<FirmaResponse> {
    return this.http.get<FirmaResponse>(`${this.apiUrl}/${medicoId}`);
  }
}
