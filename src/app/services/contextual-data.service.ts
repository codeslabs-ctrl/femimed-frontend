import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DatosPaciente {
  id: number;
  nombres: string;
  apellidos: string;
  edad: number;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento: string;
}

export interface DatosMedico {
  id: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  sexo?: string | null;
  cedula_profesional: string;
  telefono: string;
  email: string;
}

export interface UltimoInforme {
  id: number;
  titulo?: string;
  motivo_consulta: string;
  /** historico_pacientes.examenes_paraclinicos */
  examenes_paraclinicos: string;
  /** historico_pacientes.examenes_medico (examen físico) */
  examenes_medico: string;
  diagnostico: string;
  tratamiento: string;
  conclusiones: string;
  fecha_consulta: string;
  fecha_emision: string;
}

export interface DatosContextuales {
  paciente: DatosPaciente;
  medico: DatosMedico;
  ultimoInforme?: UltimoInforme;
  historialConsultas?: UltimoInforme[];
}

export interface DatosBasicos {
  paciente: DatosPaciente;
  medico: DatosMedico;
}

export interface HistorialResponse {
  historialConsultas: UltimoInforme[];
  ultimoInforme?: UltimoInforme;
}

@Injectable({
  providedIn: 'root'
})
export class ContextualDataService {
  private apiUrl = `${environment.apiUrl}/contextual-data`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene datos contextuales completos para un informe médico
   * @param pacienteId ID del paciente
   * @param medicoId ID del médico
   * @param maxControles Opcional: número máximo de controles a devolver (para selector en informe)
   * @returns Observable con respuesta del backend
   */
  obtenerDatosContextuales(pacienteId: number, medicoId: number, maxControles?: number): Observable<{success: boolean, data: DatosContextuales}> {
    let params = new HttpParams();
    if (maxControles != null && maxControles > 0) {
      params = params.set('maxControles', String(maxControles));
    }
    return this.http.get<{success: boolean, data: DatosContextuales}>(`${this.apiUrl}/${pacienteId}/${medicoId}`, { params });
  }

  /**
   * Obtiene datos contextuales básicos (solo paciente y médico)
   * @param pacienteId ID del paciente
   * @param medicoId ID del médico
   * @returns Observable con datos básicos
   */
  obtenerDatosBasicos(pacienteId: number, medicoId: number): Observable<DatosBasicos> {
    return this.http.get<DatosBasicos>(`${this.apiUrl}/basicos/${pacienteId}/${medicoId}`);
  }

  /**
   * Obtiene historial de consultas entre paciente y médico
   * @param pacienteId ID del paciente
   * @param medicoId ID del médico
   * @returns Observable con historial de consultas
   */
  obtenerHistorialConsultas(pacienteId: number, medicoId: number): Observable<HistorialResponse> {
    return this.http.get<HistorialResponse>(`${this.apiUrl}/historial/${pacienteId}/${medicoId}`);
  }

  /**
   * Obtiene datos contextuales con manejo de errores
   * @param pacienteId ID del paciente
   * @param medicoId ID del médico
   * @param maxControles Opcional: número máximo de controles (ej. 36 para selector en informe)
   * @returns Promise con datos contextuales o null si hay error
   */
  async obtenerDatosContextualesSeguro(pacienteId: number, medicoId: number, maxControles?: number): Promise<DatosContextuales | null> {
    try {
      const response = await this.obtenerDatosContextuales(pacienteId, medicoId, maxControles).toPromise();
      console.log('🔍 Respuesta del backend:', response);
      
      // El backend devuelve {success: true, data: datosContextuales}
      if (response && response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo datos contextuales:', error);
      return null;
    }
  }

  /**
   * Obtiene datos básicos con manejo de errores
   * @param pacienteId ID del paciente
   * @param medicoId ID del médico
   * @returns Promise con datos básicos o null si hay error
   */
  async obtenerDatosBasicosSeguro(pacienteId: number, medicoId: number): Promise<DatosBasicos | null> {
    try {
      const datos = await this.obtenerDatosBasicos(pacienteId, medicoId).toPromise();
      return datos || null;
    } catch (error) {
      console.error('Error obteniendo datos básicos:', error);
      return null;
    }
  }

  /**
   * Obtiene historial de consultas con manejo de errores
   * @param pacienteId ID del paciente
   * @param medicoId ID del médico
   * @returns Promise con historial o null si hay error
   */
  async obtenerHistorialConsultasSeguro(pacienteId: number, medicoId: number): Promise<HistorialResponse | null> {
    try {
      const historial = await this.obtenerHistorialConsultas(pacienteId, medicoId).toPromise();
      return historial || null;
    } catch (error) {
      console.error('Error obteniendo historial de consultas:', error);
      return null;
    }
  }

  /**
   * Formatea datos del paciente para mostrar en la interfaz
   * @param paciente Datos del paciente
   * @returns String formateado con información del paciente
   */
  formatearDatosPaciente(paciente: DatosPaciente): string {
    return `${paciente.nombres} ${paciente.apellidos} (${paciente.edad} años) - ${paciente.cedula}`;
  }

  /**
   * Formatea datos del médico para mostrar en la interfaz
   * @param medico Datos del médico
   * @returns String formateado con información del médico
   */
  formatearDatosMedico(medico: DatosMedico): string {
    const titulo = medico.sexo === 'Femenino' ? 'Dra.' : 'Dr.';
    return `${titulo} ${medico.nombres} ${medico.apellidos} - ${medico.especialidad}`;
  }

  /**
   * Formatea fecha para mostrar en la interfaz
   * @param fecha Fecha en formato ISO
   * @returns String formateado de la fecha
   */
  formatearFecha(fecha: string): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calcula días transcurridos desde una fecha
   * @param fecha Fecha en formato ISO
   * @returns Número de días transcurridos
   */
  calcularDiasTranscurridos(fecha: string): number {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - fechaObj.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica si hay datos contextuales disponibles
   * @param datosContextuales Datos contextuales
   * @returns true si hay datos disponibles
   */
  tieneDatosContextuales(datosContextuales: DatosContextuales | null): boolean {
    return datosContextuales !== null && 
           datosContextuales.paciente !== null && 
           datosContextuales.medico !== null;
  }

  /**
   * Verifica si hay sugerencias disponibles del último informe
   * @param datosContextuales Datos contextuales
   * @returns true si hay sugerencias disponibles
   */
  tieneSugerencias(datosContextuales: DatosContextuales | null): boolean {
    return datosContextuales !== null && 
           datosContextuales.ultimoInforme !== null && 
           datosContextuales.ultimoInforme !== undefined;
  }

  /**
   * Verifica si hay historial de consultas disponible
   * @param datosContextuales Datos contextuales
   * @returns true si hay historial disponible
   */
  tieneHistorial(datosContextuales: DatosContextuales | null): boolean {
    return datosContextuales !== null && 
           datosContextuales.historialConsultas !== null && 
           datosContextuales.historialConsultas !== undefined &&
           datosContextuales.historialConsultas.length > 0;
  }
}
