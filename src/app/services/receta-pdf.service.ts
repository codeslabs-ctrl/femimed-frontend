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

@Injectable({ providedIn: 'root' })
export class RecetaPdfService {
  constructor(private http: HttpClient) {}

  generarPdf(payload: RecetaPdfPayload): Observable<Blob> {
    return this.http.post(`${environment.apiUrl}/pdf/receta-medico`, payload, {
      responseType: 'blob'
    });
  }
}
