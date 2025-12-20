export interface ConsultaFinanciera {
  id: number;
  paciente_nombre: string;
  paciente_apellidos: string;
  paciente_cedula: string;
  medico_nombre: string;
  medico_apellidos: string;
  especialidad_nombre: string;
  fecha_consulta: string;
  hora_consulta: string;
  estado_consulta: string;
  servicios: ServicioFinanciero[];
  total_consulta: number;
  moneda_principal: string;
  fecha_pago?: string;
  metodo_pago?: string;
  observaciones_financieras?: string;
}

export interface ServicioFinanciero {
  id: number;
  nombre_servicio: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  descuento?: number;
  total_servicio: number;
  moneda_pago: string;
}

export interface ResumenFinanciero {
  total_consultas: number;
  total_ingresos: number;
  total_por_especialidad: { [especialidad: string]: number };
  total_por_medico: { [medico: string]: number };
  consultas_pagadas: number;
  consultas_pendientes: number;
}

export interface FiltrosFinancieros {
  fecha_desde: string;
  fecha_hasta: string;
  medico_id?: number;
  especialidad_id?: number;
  estado_pago?: 'pagado' | 'pendiente' | 'todos';
  paciente_cedula?: string;
}

export interface PaginacionInfo {
  pagina_actual: number;
  limite: number;
  total_registros: number;
  total_paginas: number;
  tiene_siguiente: boolean;
  tiene_anterior: boolean;
}

export interface EstadisticasPorMoneda {
  total_consultas: number;
  total_ingresos: number;
  consultas_pagadas: number;
  consultas_pendientes: number;
  promedio_por_consulta: number;
}

export interface ResumenFinancieroMejorado {
  total_consultas: number;
  total_ingresos: number;
  total_por_especialidad: { [key: string]: number };
  total_por_medico: { [key: string]: number };
  consultas_pagadas: number;
  consultas_pendientes: number;
  estadisticas_por_moneda: { [key: string]: EstadisticasPorMoneda };
  moneda_filtrada: string;
}

export interface OpcionesExportacion {
  moneda: 'VES' | 'USD' | 'TODAS';
  formato: 'pdf' | 'excel';
  rango: 'pagina_actual' | 'todas' | 'rango_personalizado';
  incluir_totales: boolean;
  incluir_graficos: boolean;
  orden: 'fecha_asc' | 'fecha_desc' | 'monto_asc' | 'monto_desc';
}

