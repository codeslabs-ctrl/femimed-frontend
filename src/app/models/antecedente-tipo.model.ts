/**
 * Tipos de antecedente para agrupar en el formulario de historia clínica.
 * antecedentes_medicos | antecedentes_quirurgicos | habitos_psicobiologicos
 */
export type AntecedenteTipoEnum = 'antecedentes_medicos' | 'antecedentes_quirurgicos' | 'habitos_psicobiologicos';

/**
 * Qué tipo de detalle se pide cuando el usuario marca "Sí".
 * ninguno: solo SI/NO
 * tratamiento: campo "Tratamiento" (ej. medicación)
 * especifique: campo texto libre "Especifique"
 * cirugia: Tipo de cirugía + Año (se guarda en detalle como JSON)
 */
export type RequiereDetalleEnum = 'ninguno' | 'tratamiento' | 'especifique' | 'cirugia';

export interface AntecedenteMedicoTipo {
  id?: number;
  tipo: AntecedenteTipoEnum;
  nombre: string;
  requiere_detalle: RequiereDetalleEnum;
  orden: number;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export const ANTECEDENTE_TIPO_LABELS: Record<AntecedenteTipoEnum, string> = {
  antecedentes_medicos: 'Antecedentes Médicos',
  antecedentes_quirurgicos: 'Antecedentes Quirúrgicos',
  habitos_psicobiologicos: 'Hábitos Psicobiológicos'
};

export const REQUIERE_DETALLE_LABELS: Record<RequiereDetalleEnum, string> = {
  ninguno: 'Solo Sí/No',
  tratamiento: 'Tratamiento (a recibir)',
  especifique: 'Especifique (texto libre)',
  cirugia: 'Tipo de cirugía + Año'
};
