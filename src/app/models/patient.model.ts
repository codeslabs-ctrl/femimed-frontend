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
  medico_id?: number;
  motivo_consulta?: string; // Opcional - solo para edición
  diagnostico?: string; // Opcional - solo para edición
  conclusiones?: string; // Opcional - solo para edición
  fecha_creacion: string;
  fecha_actualizacion: string;
  historico_id?: number; // ID del historial médico asociado
  activo: boolean; // Estado activo/inactivo del paciente
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: {
    message: string;
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
