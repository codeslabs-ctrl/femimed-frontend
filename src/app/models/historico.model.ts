export interface Historico {
  id: number;
  paciente_id: number;
  medico_id: number;
  motivo_consulta: string;
  diagnostico: string;
  conclusiones?: string;
  plan?: string;
  fecha_consulta: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface HistoricoWithDetails extends Historico {
  paciente_nombre?: string;
  paciente_apellidos?: string;
  paciente_cedula?: string;
  medico_nombre?: string;
  medico_apellidos?: string;
  especialidad_nombre?: string;
}
