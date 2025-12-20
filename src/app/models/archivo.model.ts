export interface ArchivoAnexo {
  id?: number;
  historia_id: number;
  nombre_original: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_mime: string;
  tamano_bytes: number;
  descripcion?: string;
  fecha_subida?: string;
  fecha_actualizacion?: string;
  activo?: boolean;
}

export interface ArchivoFormData {
  archivo: File;
  descripcion: string;
}

export interface ArchivoUploadResponse {
  success: boolean;
  data?: ArchivoAnexo;
  error?: string;
}
