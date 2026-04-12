import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecetaPdfPayload {
  tipo: 'recipe' | 'indicaciones' | 'ambos';
  contenido: string;
  paciente_id?: number | null;
  fecha_emision?: string | null;
  pies_clinica_ids?: number[];
}

export interface EnviarRecetaEmailResponse {
  success: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class RecetaPdfService {
  constructor(private http: HttpClient) {}

  generarPdf(payload: RecetaPdfPayload): Observable<Blob> {
    return this.http.post(`${environment.apiUrl}/pdf/receta-medico`, payload, {
      responseType: 'blob'
    });
  }

  /** Envía el mismo récipe como PDF por correo (destinatario indicado por el médico). */
  enviarPorEmail(
    payload: RecetaPdfPayload & { email: string }
  ): Observable<EnviarRecetaEmailResponse> {
    return this.http.post<EnviarRecetaEmailResponse>(
      `${environment.apiUrl}/pdf/receta-medico/enviar-email`,
      payload
    );
  }
}
