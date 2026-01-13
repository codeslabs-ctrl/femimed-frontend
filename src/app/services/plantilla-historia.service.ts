import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlantillaHistoria {
  id?: number;
  medico_id: number;
  nombre: string;
  descripcion?: string;
  motivo_consulta_template?: string;
  examenes_medico_template?: string;
  diagnostico_template?: string;
  conclusiones_template?: string;
  plan_template?: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlantillaHistoriaService {
  private apiUrl = `${environment.apiUrl}/plantillas-historias`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las plantillas del médico autenticado
   */
  obtenerPlantillas(soloActivas: boolean = true): Observable<{success: boolean, data: PlantillaHistoria[]}> {
    const params = soloActivas ? { activas: 'true' } : { activas: 'false' };
    return this.http.get<{success: boolean, data: PlantillaHistoria[]}>(this.apiUrl, { params });
  }

  /**
   * Obtiene una plantilla por su ID
   */
  obtenerPlantillaPorId(id: number): Observable<{success: boolean, data: PlantillaHistoria}> {
    return this.http.get<{success: boolean, data: PlantillaHistoria}>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva plantilla
   */
  crearPlantilla(plantilla: Omit<PlantillaHistoria, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Observable<{success: boolean, data: PlantillaHistoria}> {
    return this.http.post<{success: boolean, data: PlantillaHistoria}>(this.apiUrl, plantilla);
  }

  /**
   * Actualiza una plantilla existente
   */
  actualizarPlantilla(id: number, plantilla: Partial<PlantillaHistoria>): Observable<{success: boolean, data: PlantillaHistoria}> {
    return this.http.put<{success: boolean, data: PlantillaHistoria}>(`${this.apiUrl}/${id}`, plantilla);
  }

  /**
   * Elimina una plantilla (soft delete)
   */
  eliminarPlantilla(id: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.apiUrl}/${id}`);
  }

  /**
   * Aplica una plantilla a los campos del formulario
   */
  aplicarPlantilla(plantilla: PlantillaHistoria): {
    motivo_consulta: string;
    examenes_medico: string;
    diagnostico: string;
    conclusiones: string;
    plan: string;
  } {
    return {
      motivo_consulta: plantilla.motivo_consulta_template || '',
      examenes_medico: plantilla.examenes_medico_template || '',
      diagnostico: plantilla.diagnostico_template || '',
      conclusiones: plantilla.conclusiones_template || '',
      plan: plantilla.plan_template || ''
    };
  }
}

