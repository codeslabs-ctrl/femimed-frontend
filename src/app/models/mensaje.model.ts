export interface MensajeDifusion {
  id?: number;
  titulo: string;
  contenido: string;
  tipo_mensaje?: string;
  canal?: string | string[];
  estado?: string;
  fecha_creacion?: string;
  fecha_programado?: string;
  fecha_envio?: string;
  creado_por?: number;
  total_destinatarios?: number;
  total_enviados?: number;
  total_fallidos?: number;
}

export interface MensajeDestinatario {
  id?: number;
  mensaje_id: number;
  paciente_id: number;
  email: string;
  estado_envio?: string;
  fecha_envio?: string;
  error_mensaje?: string;
  intentos?: number;
  paciente?: {
    nombres: string;
    apellidos: string;
    email: string;
  };
}

export interface MensajeFormData {
  titulo: string;
  contenido: string;
  tipo_mensaje: string;
  canal?: string | string[];
  fecha_programado?: string;
  destinatarios: number[]; // IDs de pacientes
}

export interface PacienteParaDifusion {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  edad?: number;
  sexo?: string;
  activo?: boolean;
  cedula?: string;
  medico_nombre?: string;
  especialidad_nombre?: string;
  ultima_consulta?: string;
  seleccionado?: boolean;
}

export interface MensajeEstadisticas {
  total_mensajes: number;
  mensajes_enviados: number;
  mensajes_programados: number;
  mensajes_borrador: number;
  total_destinatarios: number;
  tasa_entrega: number;
}
