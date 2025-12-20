import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  ConsultaFinanciera, 
  ResumenFinanciero, 
  ResumenFinancieroMejorado,
  FiltrosFinancieros, 
  PaginacionInfo, 
  OpcionesExportacion 
} from '../pages/admin/finanzas/models/finanzas.model';

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  private apiUrl = `${environment.apiUrl}/finanzas`;

  constructor(private http: HttpClient) {}

  // Obtener consultas financieras con filtros, paginación y moneda
  getConsultasFinancieras(
    filtros: FiltrosFinancieros, 
    paginacion?: { pagina: number, limite: number },
    moneda?: string
  ): Observable<{success: boolean, data: ConsultaFinanciera[], paginacion?: PaginacionInfo}> {
    return this.http.post<{success: boolean, data: ConsultaFinanciera[], paginacion?: PaginacionInfo}>(
      `${this.apiUrl}/consultas`, 
      { filtros, paginacion, moneda }
    );
  }

  // Obtener resumen financiero con separación por moneda
  getResumenFinanciero(
    filtros: FiltrosFinancieros, 
    moneda?: string
  ): Observable<{success: boolean, data: ResumenFinancieroMejorado}> {
    return this.http.post<{success: boolean, data: ResumenFinancieroMejorado}>(
      `${this.apiUrl}/resumen`, 
      { filtros, moneda }
    );
  }

  // Marcar consulta como pagada
  marcarConsultaPagada(consultaId: number, datosPago: {
    fecha_pago: string;
    metodo_pago: string;
    observaciones?: string;
  }): Observable<{success: boolean, data: any}> {
    return this.http.post<{success: boolean, data: any}>(`${this.apiUrl}/consultas/${consultaId}/pagar`, datosPago);
  }

  // Exportar reporte financiero básico
  exportarReporte(filtros: FiltrosFinancieros, formato: 'pdf' | 'excel'): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/exportar`, { filtros, formato }, {
      responseType: 'blob'
    });
  }

  // Exportar reporte financiero avanzado
  exportarReporteAvanzado(
    filtros: FiltrosFinancieros, 
    opciones: OpcionesExportacion
  ): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/exportar-avanzado`, { filtros, opciones }, {
      responseType: 'blob'
    });
  }
}

