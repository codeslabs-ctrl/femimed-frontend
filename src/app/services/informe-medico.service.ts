import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CrearInformeRequest } from '../models/informe-medico.model';

export interface InformeMedico {
  id?: number;
  numero_informe: string;
  titulo: string;
  tipo_informe: string;
  contenido: string;
  paciente_id: number;
  medico_id: number;
  template_id?: number;
  estado: 'borrador' | 'finalizado' | 'firmado' | 'enviado';
  fecha_emision: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  clinica_alias: string;
  observaciones?: string;
  numero_secuencial?: number;
  // Relaciones
  pacientes?: {
    id: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    email?: string;
    telefono?: string;
  };
  medicos?: {
    id: number;
    nombres: string;
    apellidos: string;
    especialidad_id?: number;
  };
  templates_informes?: {
    id: number;
    nombre: string;
    descripcion: string;
    contenido_template?: string;
  };
}

export interface TemplateInforme {
  id?: number;
  nombre: string;
  descripcion: string;
  tipo_informe: string;
  contenido_template: string;
  especialidad_id?: number;
  activo: boolean;
  fecha_creacion: string;
  clinica_alias: string;
}

export interface AnexoInforme {
  id?: number;
  informe_id: number;
  nombre_archivo: string;
  tipo_archivo: string;
  tamaño_archivo: number;
  ruta_archivo: string;
  fecha_subida: string;
  descripcion?: string;
}

export interface EnvioInforme {
  id?: number;
  informe_id: number;
  paciente_id: number;
  metodo_envio: 'email' | 'sms' | 'whatsapp' | 'presencial';
  estado_envio: 'pendiente' | 'enviado' | 'fallido' | 'entregado';
  fecha_envio: string;
  fecha_entrega?: string;
  observaciones?: string;
  destinatario: string;
  pacientes?: {
    id: number;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
  };
}

export interface FirmaDigital {
  valida: boolean;
  firma_hash: string;
  fecha_firma: string;
  certificado_digital: string;
  medico_id: number;
}

export interface EstadisticasInformes {
  total_informes: number;
  informes_firmados: number;
  informes_sin_firma: number;
  porcentaje_firmados: number;
}

@Injectable({
  providedIn: 'root'
})
export class InformeMedicoService {
  private apiUrl = `${environment.apiUrl}/informes-medicos`;
  private baseUrl = `${environment.apiUrl}/informes-medicos`;

  constructor(private http: HttpClient) { }

  // =====================================================
  // INFORMES MÉDICOS
  // =====================================================

  crearInforme(informe: CrearInformeRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}`, informe);
  }

  obtenerInformes(filtros: {
    medico_id?: number;
    paciente_id?: number;
    estado?: string;
    tipo_informe?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    busqueda?: string;
  } = {}): Observable<any> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      const value = filtros[key as keyof typeof filtros];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}`, { params });
  }

  obtenerInformePorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  actualizarInforme(id: number, informe: Partial<InformeMedico>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, informe);
  }

  eliminarInforme(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // =====================================================
  // TEMPLATES DE INFORMES
  // =====================================================

  obtenerTemplates(filtros: {
    especialidad_id?: number;
    tipo_informe?: string;
    activa?: boolean;
  } = {}): Observable<any> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      const value = filtros[key as keyof typeof filtros];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/templates/list`, { params });
  }

  crearTemplate(template: Omit<TemplateInforme, 'id' | 'fecha_creacion' | 'clinica_alias'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/templates`, template);
  }

  obtenerTemplate(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates/${id}`);
  }

  actualizarTemplate(id: number, template: Omit<TemplateInforme, 'id' | 'fecha_creacion' | 'clinica_alias'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/templates/${id}`, template);
  }

  eliminarTemplate(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/templates/${id}`);
  }

  // =====================================================
  // ANEXOS
  // =====================================================

  obtenerAnexosPorInforme(informeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${informeId}/anexos`);
  }

  agregarAnexo(anexo: Omit<AnexoInforme, 'id' | 'fecha_subida'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/${anexo.informe_id}/anexos`, anexo);
  }

  eliminarAnexo(anexoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/anexos/${anexoId}`);
  }

  // =====================================================
  // ENVÍOS
  // =====================================================

  obtenerEnviosPorInforme(informeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${informeId}/envios`);
  }

  enviarInforme(envio: Omit<EnvioInforme, 'id' | 'fecha_envio'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/${envio.informe_id}/enviar`, envio);
  }

  // =====================================================
  // FIRMA DIGITAL
  // =====================================================

  firmarInforme(informeId: number, certificadoDigital: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${informeId}/firmar`, {
      certificado_digital: certificadoDigital
    });
  }

  verificarFirmaDigital(informeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${informeId}/verificar-firma`);
  }

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  obtenerEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/general`);
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  generarNumeroInforme(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INF-${timestamp}-${random}`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'borrador': '#6b7280',
      'finalizado': '#3b82f6',
      'firmado': '#10b981',
      'enviado': '#8b5cf6'
    };
    return colores[estado] || '#6b7280';
  }

  obtenerEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'borrador': 'Borrador',
      'finalizado': 'Finalizado',
      'firmado': 'Firmado',
      'enviado': 'Enviado'
    };
    return textos[estado] || estado;
  }

  obtenerTipoInformeTexto(tipo: string): string {
    const textos: { [key: string]: string } = {
      'consulta': 'Consulta Médica',
      'examen': 'Examen Médico',
      'procedimiento': 'Procedimiento',
      'seguimiento': 'Seguimiento',
      'emergencia': 'Emergencia',
      'control': 'Control Médico'
    };
    return textos[tipo] || tipo;
  }

  obtenerMetodoEnvioTexto(metodo: string): string {
    const textos: { [key: string]: string } = {
      'email': 'Correo Electrónico',
      'sms': 'SMS',
      'whatsapp': 'WhatsApp',
      'presencial': 'Presencial'
    };
    return textos[metodo] || metodo;
  }

  obtenerIconoMetodo(metodo: string): string {
    const iconos: { [key: string]: string } = {
      'email': 'fas fa-envelope',
      'sms': 'fas fa-sms',
      'whatsapp': 'fab fa-whatsapp',
      'presencial': 'fas fa-handshake'
    };
    return iconos[metodo] || 'fas fa-paper-plane';
  }

  obtenerEstadoEnvioColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'pendiente': '#f59e0b',
      'enviado': '#10b981',
      'fallido': '#ef4444',
      'entregado': '#8b5cf6'
    };
    return colores[estado] || '#6b7280';
  }

  obtenerEstadoEnvioTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'enviado': 'Enviado',
      'fallido': 'Fallido',
      'entregado': 'Entregado'
    };
    return textos[estado] || estado;
  }

  // =====================================================
  // VALIDACIONES
  // =====================================================

  validarContenidoInforme(contenido: string): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!contenido || contenido.trim().length === 0) {
      errores.push('El contenido del informe es requerido');
    }

    if (contenido && contenido.length < 50) {
      errores.push('El contenido del informe debe tener al menos 50 caracteres');
    }

    if (contenido && contenido.length > 10000) {
      errores.push('El contenido del informe no puede exceder 10,000 caracteres');
    }

    return {
      valida: errores.length === 0,
      errores
    };
  }

  validarTemplate(template: Partial<TemplateInforme>): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!template.nombre || template.nombre.trim().length === 0) {
      errores.push('El nombre del template es requerido');
    }

    if (!template.tipo_informe || template.tipo_informe.trim().length === 0) {
      errores.push('El tipo de informe es requerido');
    }

    if (!template.contenido_template || template.contenido_template.trim().length === 0) {
      errores.push('El contenido del template es requerido');
    }

    if (template.contenido_template && template.contenido_template.length < 100) {
      errores.push('El contenido del template debe tener al menos 100 caracteres');
    }

    return {
      valida: errores.length === 0,
      errores
    };
  }

  // =====================================================
  // EXPORTAR/IMPORTAR
  // =====================================================

  exportarInforme(informe: InformeMedico): string {
    const contenido = `
INFORME MÉDICO
==============

Número: ${informe.numero_informe}
Título: ${informe.titulo}
Tipo: ${this.obtenerTipoInformeTexto(informe.tipo_informe)}
Estado: ${this.obtenerEstadoTexto(informe.estado)}
Fecha: ${this.formatearFecha(informe.fecha_emision)}

Paciente: ${informe.pacientes?.nombres} ${informe.pacientes?.apellidos}
Médico: ${informe.medicos?.nombres} ${informe.medicos?.apellidos}

CONTENIDO:
----------
${informe.contenido}

${informe.observaciones ? `OBSERVACIONES:
${informe.observaciones}` : ''}
    `.trim();

    return contenido;
  }

  generarPDF(informe: InformeMedico): void {
    // Implementar generación de PDF
    console.log('Generando PDF para informe:', informe.numero_informe);
  }

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  getEstadisticasInformes(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    
    return this.http.get<any>(`${this.baseUrl}/estadisticas/general`, { params });
  }

  getEstadisticasPorMedico(medicoId: number, fechaInicio?: string, fechaFin?: string): Observable<any> {
    let params = new HttpParams().set('medico_id', medicoId.toString());
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    
    return this.http.get<any>(`${this.baseUrl}/estadisticas/medico`, { params });
  }

  getEstadisticasTodosMedicos(fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    
    return this.http.get<any[]>(`${this.baseUrl}/estadisticas/medicos`, { params });
  }

  getInformes(page: number = 1, limit: number = 10, filtros?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== undefined && filtros[key] !== null && filtros[key] !== '') {
          params = params.set(key, filtros[key].toString());
        }
      });
    }
    
    return this.http.get<any>(`${this.baseUrl}`, { params });
  }

  // =====================================================
  // ENVÍO DE INFORMES POR EMAIL
  // =====================================================

  /**
   * Envía un informe médico por email al paciente
   * @param informeId ID del informe a enviar
   * @returns Observable con la respuesta del servidor
   */
  enviarInformePorEmail(informeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${informeId}/enviar`, {});
  }

  /**
   * Genera y descarga el PDF de un informe médico
   * @param informeId ID del informe
   * @returns Observable con el blob del PDF
   */
  generarPDFInforme(informeId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/pdf/informe/${informeId}`, { 
      responseType: 'blob' 
    });
  }
}
