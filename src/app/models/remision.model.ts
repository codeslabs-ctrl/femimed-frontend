export interface Remision {
  id?: number;
  paciente_id: number;
  medico_remitente_id: number;
  medico_remitido_id: number;
  motivo_remision: string;
  observaciones?: string;
  estado_remision: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Completada';
  fecha_remision?: string;
  fecha_respuesta?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  clinica_alias?: string;
}

export interface RemisionWithDetails extends Remision {
  paciente_nombre?: string;
  paciente_apellidos?: string;
  medico_remitente_nombre?: string;
  medico_remitente_apellidos?: string;
  medico_remitido_nombre?: string;
  medico_remitido_apellidos?: string;
}

export interface CreateRemisionRequest {
  paciente_id: number;
  medico_remitente_id: number;
  medico_remitido_id: number;
  motivo_remision: string;
  observaciones?: string;
}

export interface CrearRemisionRequest {
  paciente_id: number;
  medico_remitente_id: number;
  medico_remitido_id: number;
  motivo_remision: string;
  observaciones?: string;
}

export interface UpdateRemisionStatusRequest {
  estado_remision: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Completada';
  observaciones?: string;
}

export interface RemisionStatistics {
  total: number;
  pendientes: number;
  aceptadas: number;
  rechazadas: number;
  completadas: number;
}
