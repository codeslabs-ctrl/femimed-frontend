export interface InformeMedico {
  id?: number;
  numero_informe: string;
  titulo: string;
  tipo_informe: string;
  contenido: string;
  paciente_id: number;
  medico_id: number;
  template_id?: number;
  estado: EstadoInforme;
  fecha_emision: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  clinica_alias: string;
  observaciones?: string;
  numero_secuencial?: number;
  antecedentes_personales?: string;
  antecedentes_familiares?: string;
  antecedentes_quirurgicos?: string;
  antecedentes_otros?: string;
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
    cedula: string;
    especialidad_id?: number;
    especialidades?: {
      id: number;
      nombre_especialidad: string;
    };
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

export interface InformeEstadisticas {
  total_informes: number;
  informes_firmados: number;
  informes_sin_firma: number;
  porcentaje_firmados: number;
}

export interface MedicoEstadisticas {
  medico_id: number;
  medico_nombres: string;
  medico_apellidos: string;
  total_informes: number;
  informes_firmados: number;
  informes_sin_firma: number;
  porcentaje_firmados: number;
}

export interface FiltrosInformes {
  medico_id?: number;
  paciente_id?: number;
  estado?: string;
  tipo_informe?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  busqueda?: string;
}

export interface FiltrosTemplates {
  especialidad_id?: number;
  tipo_informe?: string;
  activa?: boolean;
}

export interface CrearInformeRequest {
  titulo: string;
  tipo_informe: string;
  contenido: string;
  paciente_id: number;
  medico_id: number;
  template_id?: number;
  estado?: 'borrador' | 'finalizado' | 'firmado' | 'enviado';
  fecha_emision?: string;
  observaciones?: string;
  antecedentes_personales?: string;
  antecedentes_familiares?: string;
  antecedentes_quirurgicos?: string;
  antecedentes_otros?: string;
}

export interface ActualizarInformeRequest {
  titulo?: string;
  tipo_informe?: string;
  contenido?: string;
  estado?: 'borrador' | 'finalizado' | 'firmado' | 'enviado';
  observaciones?: string;
  antecedentes_personales?: string;
  antecedentes_familiares?: string;
  antecedentes_quirurgicos?: string;
  antecedentes_otros?: string;
}

export interface CrearTemplateRequest {
  nombre: string;
  descripcion: string;
  tipo_informe: string;
  contenido_template: string;
  especialidad_id?: number;
  activo: boolean;
}

export interface AgregarAnexoRequest {
  informe_id: number;
  nombre_archivo: string;
  tipo_archivo: string;
  tamaño_archivo: number;
  ruta_archivo: string;
  descripcion?: string;
}

export interface EnviarInformeRequest {
  informe_id: number;
  paciente_id: number;
  metodo_envio: 'email' | 'sms' | 'whatsapp' | 'presencial';
  observaciones?: string;
  destinatario: string;
}

export interface FirmarInformeRequest {
  certificado_digital: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// Enums para tipos de datos
export enum TipoInforme {
  CONSULTA = 'consulta',
  EXAMEN = 'examen',
  PROCEDIMIENTO = 'procedimiento',
  SEGUIMIENTO = 'seguimiento',
  EMERGENCIA = 'emergencia',
  CONTROL = 'control'
}

export enum EstadoInforme {
  BORRADOR = 'borrador',
  FINALIZADO = 'finalizado',
  FIRMADO = 'firmado',
  ENVIADO = 'enviado'
}

export enum MetodoEnvio {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PRESENCIAL = 'presencial'
}

export enum EstadoEnvio {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  FALLIDO = 'fallido',
  ENTREGADO = 'entregado'
}

// Constantes para validación
export const LIMITES_INFORME = {
  CONTENIDO_MIN: 50,
  CONTENIDO_MAX: 10000,
  TITULO_MIN: 5,
  TITULO_MAX: 200,
  OBSERVACIONES_MAX: 1000
} as const;

export const TIPOS_ARCHIVO_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
] as const;

export const TAMAÑO_MAXIMO_ARCHIVO = 10 * 1024 * 1024; // 10MB
