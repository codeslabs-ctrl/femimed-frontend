import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArchivoAnexo, ArchivoUploadResponse } from '../models/archivo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Subir múltiples archivos
  uploadArchivos(historiaId: number, archivos: File[], descripciones: string[]): Observable<ArchivoUploadResponse> {
    const formData = new FormData();
    
    // Agregar todos los archivos
    archivos.forEach(archivo => {
      formData.append('archivos', archivo);
    });
    
    // Agregar descripciones como JSON
    formData.append('descripciones', JSON.stringify(descripciones));
    formData.append('historia_id', historiaId.toString());

    return this.http.post<ArchivoUploadResponse>(`${this.API_URL}/archivos/upload`, formData);
  }

  // Subir un archivo (método de compatibilidad)
  uploadArchivo(historiaId: number, archivo: File, descripcion: string): Observable<ArchivoUploadResponse> {
    return this.uploadArchivos(historiaId, [archivo], [descripcion]);
  }

  // Obtener archivos por historia
  getArchivosByHistoria(historiaId: number): Observable<{success: boolean, data: ArchivoAnexo[]}> {
    return this.http.get<{success: boolean, data: ArchivoAnexo[]}>(`${this.API_URL}/archivos/historia/${historiaId}`);
  }

  // Obtener un archivo por ID
  getArchivoById(id: number): Observable<{success: boolean, data: ArchivoAnexo}> {
    return this.http.get<{success: boolean, data: ArchivoAnexo}>(`${this.API_URL}/archivos/${id}`);
  }

  // Actualizar descripción de archivo
  updateArchivo(id: number, descripcion: string): Observable<{success: boolean, data: ArchivoAnexo}> {
    return this.http.put<{success: boolean, data: ArchivoAnexo}>(`${this.API_URL}/archivos/${id}`, {
      descripcion
    });
  }

  // Eliminar archivo (marcar como inactivo)
  deleteArchivo(id: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.API_URL}/archivos/${id}`);
  }

  // Descargar archivo
  downloadArchivo(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/archivos/${id}/download`, {
      responseType: 'blob'
    });
  }
}
