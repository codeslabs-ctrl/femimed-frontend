/**
 * Respuesta del paciente para un ítem de antecedente (asociado al paciente, no al histórico).
 * presente = true → Sí; false → No.
 * detalle = tratamiento, especificación o JSON para hábitos (ej. cigarrillos/día, tipo bebida).
 */
export interface HistoricoAntecedente {
  id?: number;
  paciente_id: number;
  antecedente_tipo_id: number;
  presente: boolean;
  detalle?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

/** Respuesta del GET antecedentes: lista + campo libre "otros". */
export interface AntecedentesResponse {
  antecedentes: HistoricoAntecedente[];
  antecedentes_otros: string | null;
}

/** Para hábitos: datos estructurados guardados en detalle (JSON). */
export interface HabitoTabaquismoDetalle {
  cigarrillos_por_dia?: number;
  anos_fumando?: number;
  paquetes_ano?: number;
}

export interface HabitoAlcoholDetalle {
  tipo_bebida?: string;
  frecuencia?: string;
}

export interface HabitoDrogasDetalle {
  tipo_sustancia?: string;
  anos_consumo?: number;
}
