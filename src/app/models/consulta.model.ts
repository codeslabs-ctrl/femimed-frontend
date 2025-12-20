export interface Consulta {
  id: number;
  paciente_id: number;
  medico_id: number;
  medico_remitente_id?: number;
  motivo_consulta: string;
  tipo_consulta: 'primera_vez' | 'control' | 'seguimiento' | 'urgencia';
  fecha_pautada: string;
  hora_pautada: string;
  fecha_culminacion?: string;
  duracion_estimada: number;
  estado_consulta: 'agendada' | 'por_agendar' | 'cancelada' | 'finalizada' | 'reagendada' | 'no_asistio' | 'completada' | 'en_progreso';
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  diagnostico_preliminar?: string;
  observaciones?: string;
  notas_internas?: string;
  recordatorio_enviado: boolean;
  fecha_recordatorio?: string;
  metodo_recordatorio?: 'email' | 'sms' | 'llamada' | 'whatsapp';
  motivo_cancelacion?: string;
  fecha_cancelacion?: string;
  cancelado_por?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  creado_por?: number;
  actualizado_por?: number;
}

export interface ConsultaWithDetails extends Consulta {
  paciente_nombre?: string;
  paciente_apellidos?: string;
  paciente_cedula?: string;
  paciente_telefono?: string;
  paciente_email?: string;
  medico_nombre?: string;
  medico_apellidos?: string;
  medico_especialidad_id?: number;
  especialidad_nombre?: string;
  medico_remitente_nombre?: string;
  medico_remitente_apellidos?: string;
  creado_por_usuario?: string;
  actualizado_por_usuario?: string;
  cancelado_por_usuario?: string;
  historico_id?: number;
  diagnostico?: string;
  conclusiones?: string;
  plan?: string;
}

export interface ConsultaFormData {
  paciente_id: number;
  medico_id: number;
  medico_remitente_id?: number;
  motivo_consulta: string;
  tipo_consulta: 'primera_vez' | 'control' | 'seguimiento' | 'urgencia';
  fecha_pautada: string;
  hora_pautada: string;
  duracion_estimada: number;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  diagnostico_preliminar?: string;
  observaciones?: string;
  notas_internas?: string;
  fecha_recordatorio?: string;
  metodo_recordatorio?: 'email' | 'sms' | 'llamada' | 'whatsapp';
}

export interface ConsultaFilters {
  paciente_id?: number;
  medico_id?: number;
  estado_consulta?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  fecha?: string;
  prioridad?: string;
  tipo_consulta?: string;
  page?: number;
  limit?: number;
}
