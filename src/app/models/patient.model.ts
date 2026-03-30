export interface Patient {
  id: number;
  nombres: string;
  apellidos: string;
  cedula?: string;
  edad: number;
  sexo: 'Masculino' | 'Femenino';
  email: string;
  telefono: string;
  plan?: string;
  remitido_por?: string;
  medico_id?: number;
  antecedentes_otros?: string; // Otros antecedentes (texto libre) del paciente
  motivo_consulta?: string; // Opcional - solo para edición
  diagnostico?: string; // Opcional - solo para edición
  conclusiones?: string; // Opcional - solo para edición
  fecha_creacion: string;
  fecha_actualizacion: string;
  historico_id?: number; // ID del historial médico asociado
  activo: boolean; // Estado activo/inactivo del paciente
  tiene_consulta?: boolean; // true si tiene al menos una consulta (para mostrar Historial vs Agendar una Consulta)
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: {
    message: string;
    code?: string;
    details?: { existingPatient?: Patient };
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PatientFilters {
  nombres?: string;
  apellidos?: string;
  sexo?: string;
  edad_min?: number;
  edad_max?: number;
  email?: string;
}
