import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinanzasService } from '../../../services/finanzas.service';
import { AuthService } from '../../../services/auth.service';
import { MedicoService } from '../../../services/medico.service';
import { EspecialidadService } from '../../../services/especialidad.service';
import { DateService } from '../../../services/date.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { 
  ConsultaFinanciera, 
  ResumenFinanciero, 
  ResumenFinancieroMejorado,
  FiltrosFinancieros, 
  PaginacionInfo, 
  OpcionesExportacion 
} from './models/finanzas.model';
import { Medico } from '../../../services/medico.service';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.css']
})
export class FinanzasComponent implements OnInit {
  consultas: ConsultaFinanciera[] = [];
  resumen: ResumenFinancieroMejorado | null = null;
  medicos: Medico[] = [];
  especialidades: any[] = [];
  loading = false;
  currentUser: any = null;

  // Nuevas propiedades para paginación y moneda
  monedaSeleccionada: string = 'TODAS';
  paginacion: PaginacionInfo | null = null;
  paginaActual: number = 1;
  limitePorPagina: number = 10;
  opcionesLimite: number[] = [10, 25, 50, 100];

  // Propiedades para exportación
  mostrarOpcionesExportacion: boolean = false;
  opcionesExportacion: OpcionesExportacion = {
    moneda: 'TODAS',
    formato: 'pdf',
    rango: 'todas',
    incluir_totales: true,
    incluir_graficos: true,
    orden: 'fecha_desc'
  };

  // Propiedades para modal de detalles
  mostrarModalDetalles: boolean = false;
  consultaSeleccionada: ConsultaFinanciera | null = null;

  filtros: FiltrosFinancieros = {
    fecha_desde: '',
    fecha_hasta: '',
    estado_pago: 'todos'
  };

  constructor(
    private finanzasService: FinanzasService,
    private authService: AuthService,
    private medicoService: MedicoService,
    private especialidadService: EspecialidadService,
    private dateService: DateService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    console.log('🚀 FinanzasComponent inicializado');
    
    // Verificar que el usuario tenga rol de finanzas o administrador
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('👤 Usuario actual:', user);
      if (user?.rol !== 'finanzas' && user?.rol !== 'administrador') {
        // Redirigir o mostrar error de acceso
        console.error('Acceso denegado: Se requiere rol de finanzas o administrador');
        return;
      }
    });

    // Cargar especialidades para mapeo
    this.loadEspecialidades();

    // Establecer fechas por defecto (último mes) usando zona horaria de Venezuela
    this.filtros.fecha_desde = this.dateService.getCurrentDateISO();
    this.filtros.fecha_hasta = this.dateService.getCurrentDateISO();
    
    // Calcular hace un mes
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    this.filtros.fecha_desde = haceUnMes.toISOString().split('T')[0];
    
    console.log('📅 Filtros iniciales:', this.filtros);

    this.cargarMedicos();
    this.aplicarFiltros();
  }

  cargarMedicos(): void {
    this.medicoService.getAllMedicos().subscribe({
      next: (response) => {
        this.medicos = response.data || [];
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar médicos');
      }
    });
  }

  aplicarFiltros(): void {
    this.loading = true;
    
    let consultasCargadas = false;
    let resumenCargado = false;
    
    const verificarEstadoFinal = () => {
      if (consultasCargadas && resumenCargado) {
        this.loading = false;
      }
    };
    
    // Cargar consultas con paginación y moneda
    const paginacion = {
      pagina: this.paginaActual,
      limite: this.limitePorPagina
    };


    this.finanzasService.getConsultasFinancieras(
      this.filtros, 
      paginacion, 
      this.monedaSeleccionada
    ).subscribe({
      next: (response) => {
        // El backend ya filtra por moneda, no necesitamos filtro adicional
        this.consultas = response.data || [];
        this.paginacion = response.paginacion || null;
        consultasCargadas = true;
        verificarEstadoFinal();
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar consultas financieras');
        consultasCargadas = true;
        verificarEstadoFinal();
      }
    });

    // Cargar resumen con moneda
    this.finanzasService.getResumenFinanciero(
      this.filtros, 
      this.monedaSeleccionada
    ).subscribe({
      next: (response) => {
        console.log('✅ Resumen cargado:', response);
        this.resumen = response.data;
        console.log('💰 Resumen asignado:', this.resumen);
        resumenCargado = true;
        verificarEstadoFinal();
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar resumen financiero');
        resumenCargado = true;
        verificarEstadoFinal();
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      fecha_desde: '',
      fecha_hasta: '',
      estado_pago: 'todos'
    };
    this.aplicarFiltros();
  }

  verDetalleConsulta(consulta: ConsultaFinanciera): void {
    this.consultaSeleccionada = consulta;
    this.mostrarModalDetalles = true;
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.consultaSeleccionada = null;
  }

  marcarComoPagada(consulta: ConsultaFinanciera): void {
    const fechaPago = new Date().toISOString().split('T')[0];
    const datosPago = {
      fecha_pago: fechaPago,
      metodo_pago: 'Efectivo', // Por defecto, se puede hacer un modal para seleccionar
      observaciones: ''
    };

    this.finanzasService.marcarConsultaPagada(consulta.id, datosPago).subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Consulta marcada como pagada exitosamente');
          this.aplicarFiltros(); // Recargar datos
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'marcar consulta como pagada');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'marcar consulta como pagada');
        alert(errorMessage);
      }
    });
  }

  exportarReporte(formato: 'pdf' | 'excel'): void {
    // Mostrar mensaje de carga
    const mensajeCarga = `🔄 Generando reporte en formato ${formato.toUpperCase()}...`;
    console.log(mensajeCarga);
    
    // Mostrar alerta temporal de carga
    const alertaCarga = document.createElement('div');
    alertaCarga.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: #007bff; color: white; padding: 15px 20px;
      border-radius: 5px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    alertaCarga.textContent = mensajeCarga;
    document.body.appendChild(alertaCarga);
    
    // Incluir la moneda seleccionada en los filtros para la exportación
    const filtrosConMoneda = {
      ...this.filtros,
      moneda: this.monedaSeleccionada
    };
    
    this.finanzasService.exportarReporte(filtrosConMoneda, formato).subscribe({
      next: (blob) => {
        // Remover mensaje de carga
        document.body.removeChild(alertaCarga);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const extension = formato === 'excel' ? 'xlsx' : formato;
        link.download = `reporte_financiero_${new Date().toISOString().split('T')[0]}.${extension}`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        // Mostrar mensaje de éxito
        alert('✅ Reporte exportado exitosamente');
      },
      error: (error) => {
        // Remover mensaje de carga
        document.body.removeChild(alertaCarga);
        
        this.errorHandler.logError(error, 'exportar reporte');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'exportar reporte');
        alert(errorMessage);
      }
    });
  }

  // Nuevos métodos para paginación y moneda
  cambiarMoneda(moneda: string): void {
    this.monedaSeleccionada = moneda;
    this.paginaActual = 1; // Resetear a la primera página
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.aplicarFiltros();
  }

  cambiarLimitePorPagina(limite: number): void {
    this.limitePorPagina = limite;
    this.paginaActual = 1; // Resetear a la primera página
    this.aplicarFiltros();
  }

  irAPaginaAnterior(): void {
    if (this.paginacion?.tiene_anterior) {
      this.cambiarPagina(this.paginaActual - 1);
    }
  }

  irAPaginaSiguiente(): void {
    if (this.paginacion?.tiene_siguiente) {
      this.cambiarPagina(this.paginaActual + 1);
    }
  }

  irAPrimeraPagina(): void {
    this.cambiarPagina(1);
  }

  irAUltimaPagina(): void {
    if (this.paginacion) {
      this.cambiarPagina(this.paginacion.total_paginas);
    }
  }

  // Métodos para exportación avanzada
  mostrarOpcionesExportacionModal(): void {
    this.mostrarOpcionesExportacion = true;
  }

  cerrarOpcionesExportacion(): void {
    this.mostrarOpcionesExportacion = false;
  }

  exportarReporteAvanzado(): void {
    const formato = this.opcionesExportacion.formato;
    const mensajeCarga = `🔄 Generando reporte avanzado en formato ${formato.toUpperCase()}...`;
    console.log(mensajeCarga);
    
    // Mostrar alerta temporal de carga
    const alertaCarga = document.createElement('div');
    alertaCarga.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: #28a745; color: white; padding: 15px 20px;
      border-radius: 5px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    alertaCarga.textContent = mensajeCarga;
    document.body.appendChild(alertaCarga);
    
    // Incluir la moneda seleccionada en los filtros para la exportación avanzada
    const filtrosConMoneda = {
      ...this.filtros,
      moneda: this.monedaSeleccionada
    };
    
    this.finanzasService.exportarReporteAvanzado(filtrosConMoneda, this.opcionesExportacion).subscribe({
      next: (blob) => {
        // Remover mensaje de carga
        document.body.removeChild(alertaCarga);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const extension = this.opcionesExportacion.formato === 'excel' ? 'xlsx' : this.opcionesExportacion.formato;
        link.download = `reporte_financiero_avanzado_${this.monedaSeleccionada}_${new Date().toISOString().split('T')[0]}.${extension}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.cerrarOpcionesExportacion();
        
        // Mostrar mensaje de éxito
        alert('✅ Reporte avanzado exportado exitosamente');
      },
      error: (error) => {
        // Remover mensaje de carga
        document.body.removeChild(alertaCarga);
        
        this.errorHandler.logError(error, 'exportar reporte avanzado');
        const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'exportar reporte avanzado');
        alert(errorMessage);
      }
    });
  }

  // Métodos auxiliares para el template
  getPaginasVisibles(): number[] {
    if (!this.paginacion) return [];
    
    const totalPaginas = this.paginacion.total_paginas;
    const paginaActual = this.paginacion.pagina_actual;
    const paginas: number[] = [];
    
    // Mostrar máximo 5 páginas
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, inicio + 4);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  getMonedasDisponibles(): string[] {
    if (!this.resumen?.estadisticas_por_moneda) return [];
    return Object.keys(this.resumen.estadisticas_por_moneda);
  }

  getMaxRegistrosPagina(): number {
    if (!this.paginacion) return 0;
    return Math.min(this.paginacion.pagina_actual * this.paginacion.limite, this.paginacion.total_registros);
  }

  onLimiteChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.cambiarLimitePorPagina(+target.value);
    }
  }

  // Métodos de utilidad - usando DateService para Venezuela
  formatDate(dateString: string): string {
    return this.dateService.formatDate(dateString);
  }

  formatTime(timeString: string): string {
    return this.dateService.formatTime(timeString);
  }

  formatCurrency(amount: number, currency: string = 'COP'): string {
    const currencyMap: { [key: string]: string } = {
      'VES': 'VES',
      'USD': 'USD', 
      'COP': 'COP',
      'EUR': 'EUR'
    };
    
    const currencyCode = currencyMap[currency] || 'COP';
    
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  getEstadoText(estado: string): string {
    const estados: { [key: string]: string } = {
      'pagado': 'Pagado',
      'pendiente': 'Pendiente',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    return estado === 'pagado' ? 'pagado' : 'pendiente';
  }

  // Métodos para manejo de especialidades
  loadEspecialidades(): void {
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response) => {
        if (response.success) {
          this.especialidades = response.data || [];
          console.log('🏥 Especialidades cargadas:', this.especialidades.length);
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar especialidades');
      }
    });
  }

  getEspecialidadNombre(consulta: ConsultaFinanciera): string {
    if (consulta.especialidad_nombre) {
      // Primero verificar si ya es el nombre correcto
      const especialidad = this.especialidades.find(esp => 
        esp.nombre_especialidad === consulta.especialidad_nombre
      );
      if (especialidad) {
        return consulta.especialidad_nombre;
      } else {
        // Si no, buscar por descripción y devolver el nombre
        const especialidadPorDescripcion = this.especialidades.find(esp => 
          esp.descripcion === consulta.especialidad_nombre
        );
        if (especialidadPorDescripcion) {
          return especialidadPorDescripcion.nombre_especialidad;
        }
      }
    }
    return consulta.especialidad_nombre || 'Sin especialidad';
  }
}

