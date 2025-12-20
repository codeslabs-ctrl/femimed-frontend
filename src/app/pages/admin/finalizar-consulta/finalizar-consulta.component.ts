import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiciosService, Servicio, FinalizarConsultaRequest } from '../../../services/servicios.service';
import { ConsultaService } from '../../../services/consulta.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';

export interface ServicioSeleccionado {
  servicio_id: number;
  servicio_nombre: string;
  monto_base: number;        // Precio base del servicio
  monto_pagado: number;     // Precio real pagado (editable)
  moneda: 'VES' | 'USD';
  observaciones?: string;
}

@Component({
  selector: 'app-finalizar-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalizar-consulta.component.html',
  styleUrls: ['./finalizar-consulta.component.css']
})
export class FinalizarConsultaComponent implements OnInit, OnDestroy {
  consultaId: string = '';
  consultaInfo: any = null;
  serviciosDisponibles: Servicio[] = [];
  serviciosSeleccionados: ServicioSeleccionado[] = [];
  isSubmitting = false;
  isLoading = true;
  
  // Propiedades para cálculo de totales
  totalVES = 0;
  totalUSD = 0;
  tipoCambio = 36.50; // Tipo de cambio por defecto

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviciosService: ServiciosService,
    private consultaService: ConsultaService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    console.log('🔍 FinalizarConsultaComponent - ngOnInit');
    
    // Obtener ID de la consulta desde la ruta
    this.consultaId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.consultaId) {
      this.errorHandler.logError('No se encontró ID de consulta en la ruta', 'verificar ruta');
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.loadConsultaInfo();
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  async loadConsultaInfo(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('📋 Cargando información de consulta:', this.consultaId);

      // Cargar información de la consulta
      const consultaResponse = await this.consultaService.getConsultaById(parseInt(this.consultaId)).toPromise();
      
      if (consultaResponse && consultaResponse.success) {
        this.consultaInfo = consultaResponse.data;
        console.log('✅ Información de consulta cargada:', this.consultaInfo);
        console.log('🔍 especialidad_id:', this.consultaInfo?.especialidad_id);
        console.log('🔍 especialidad_nombre:', this.consultaInfo?.especialidad_nombre);
        
        // Cargar servicios disponibles para la especialidad
        if (this.consultaInfo?.especialidad_id) {
          console.log('🏥 Cargando servicios para especialidad:', this.consultaInfo.especialidad_id);
          await this.loadServiciosPorEspecialidad(this.consultaInfo.especialidad_id);
        } else {
          console.warn('⚠️ No se encontró especialidad_id en la consulta');
          console.log('🔍 Datos completos de la consulta:', JSON.stringify(this.consultaInfo, null, 2));
        }
      } else {
        this.errorHandler.logError(consultaResponse, 'cargar consulta');
        this.router.navigate(['/admin/dashboard']);
      }
    } catch (error) {
      this.errorHandler.logError(error, 'cargar información de consulta');
      this.router.navigate(['/admin/dashboard']);
    } finally {
      this.isLoading = false;
    }
  }

  async loadServiciosPorEspecialidad(especialidadId: number): Promise<void> {
    try {
      console.log('🏥 Cargando servicios para especialidad:', especialidadId);
      
      const response = await this.serviciosService.getServiciosPorEspecialidad(especialidadId).toPromise();
      
      if (response && response.success) {
        this.serviciosDisponibles = response.data || [];
        console.log('✅ Servicios cargados:', this.serviciosDisponibles);
      } else {
        console.warn('⚠️ No se encontraron servicios para la especialidad');
        this.serviciosDisponibles = [];
      }
      
      // Si no hay servicios disponibles, crear un servicio predeterminado "Consulta"
      if (this.serviciosDisponibles.length === 0) {
        console.log('📝 Creando servicio predeterminado "Consulta"');
        const servicioPredeterminado: Servicio = {
          id: -1, // ID especial que indica servicio predeterminado
          nombre_servicio: 'Consulta',
          especialidad_id: especialidadId,
          monto_base: 80,
          moneda: 'USD',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        this.serviciosDisponibles = [servicioPredeterminado];
        console.log('✅ Servicio predeterminado creado:', servicioPredeterminado);
        
        // Pre-seleccionar automáticamente el servicio predeterminado
        this.serviciosSeleccionados = [{
          servicio_id: -1,
          servicio_nombre: 'Consulta',
          monto_base: 80,
          monto_pagado: 80,
          moneda: 'USD',
          observaciones: ''
        }];
        console.log('✅ Servicio predeterminado pre-seleccionado');
      }
    } catch (error) {
      this.errorHandler.logError(error, 'cargar servicios');
      this.serviciosDisponibles = [];
      
      // Si hay error, también crear servicio predeterminado
      if (this.consultaInfo?.especialidad_id) {
        console.log('📝 Creando servicio predeterminado "Consulta" debido a error');
        const servicioPredeterminado: Servicio = {
          id: -1,
          nombre_servicio: 'Consulta',
          especialidad_id: this.consultaInfo.especialidad_id,
          monto_base: 80,
          moneda: 'USD',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        this.serviciosDisponibles = [servicioPredeterminado];
        this.serviciosSeleccionados = [{
          servicio_id: -1,
          servicio_nombre: 'Consulta',
          monto_base: 80,
          monto_pagado: 80,
          moneda: 'USD',
          observaciones: ''
        }];
      }
    }
  }

  isServicioSeleccionado(servicioId: number): boolean {
    return this.serviciosSeleccionados.some(s => s.servicio_id === servicioId);
  }

  getServicioSeleccionado(servicioId: number): ServicioSeleccionado {
    let servicio = this.serviciosSeleccionados.find(s => s.servicio_id === servicioId);
    if (!servicio) {
      const servicioOriginal = this.serviciosDisponibles.find(s => s.id === servicioId);
      servicio = {
        servicio_id: servicioId,
        servicio_nombre: servicioOriginal?.nombre_servicio || '',
        monto_base: servicioOriginal?.monto_base || 0,
        monto_pagado: servicioOriginal?.monto_base || 0,
        moneda: servicioOriginal?.moneda as 'VES' | 'USD' || 'VES',
        observaciones: ''
      };
      this.serviciosSeleccionados.push(servicio);
    }
    return servicio;
  }

  toggleServicio(servicio: Servicio): void {
    const index = this.serviciosSeleccionados.findIndex(s => s.servicio_id === servicio.id);
    if (index >= 0) {
      this.serviciosSeleccionados.splice(index, 1);
    } else {
      this.serviciosSeleccionados.push({
        servicio_id: servicio.id,
        servicio_nombre: servicio.nombre_servicio,
        monto_base: servicio.monto_base,
        monto_pagado: servicio.monto_base, // Inicializar con precio base
        moneda: servicio.moneda as 'VES' | 'USD',
        observaciones: ''
      });
    }
    
    // Recalcular totales
    this.calcularTotales();
  }

  updateServicioSeleccionado(servicioId: number, field: string, value: any): void {
    const servicio = this.getServicioSeleccionado(servicioId);
    (servicio as any)[field] = value;
  }

  onMontoInput(servicioId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateServicioSeleccionado(servicioId, 'monto_pagado', parseFloat(target.value) || 0);
    this.calcularTotales();
  }

  onMonedaChange(servicioId: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateServicioSeleccionado(servicioId, 'moneda', target.value);
    this.calcularTotales();
  }

  onObservacionesInput(servicioId: number, event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateServicioSeleccionado(servicioId, 'observaciones', target.value);
  }

  removeServicio(servicioId: number): void {
    const index = this.serviciosSeleccionados.findIndex(s => s.servicio_id === servicioId);
    if (index >= 0) {
      this.serviciosSeleccionados.splice(index, 1);
      this.calcularTotales();
    }
  }

  calcularTotales(): void {
    this.totalVES = 0;
    this.totalUSD = 0;

    this.serviciosSeleccionados.forEach(servicio => {
      if (servicio.moneda === 'VES') {
        this.totalVES += servicio.monto_pagado;
      } else if (servicio.moneda === 'USD') {
        this.totalUSD += servicio.monto_pagado;
      }
    });
  }

  validarMontos(): boolean {
    return this.serviciosSeleccionados.every(servicio => 
      servicio.monto_pagado > 0 && 
      servicio.monto_pagado !== null && 
      !isNaN(servicio.monto_pagado)
    );
  }

  canFinalizar(): boolean {
    // Se debe seleccionar al menos un servicio
    if (this.serviciosSeleccionados.length === 0) {
      return false;
    }
    
    // Validar montos de los servicios seleccionados
    return this.validarMontos();
  }
  
  tieneServiciosDisponibles(): boolean {
    return this.serviciosDisponibles.length > 0;
  }
  
  tieneServiciosSeleccionados(): boolean {
    return this.serviciosSeleccionados.length > 0;
  }

  async finalizarConsulta(): Promise<void> {
    if (!this.canFinalizar() || this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      const request: FinalizarConsultaRequest = {
        servicios: this.serviciosSeleccionados.length > 0 
          ? this.serviciosSeleccionados.map(s => ({
              servicio_id: s.servicio_id,
              monto_pagado: s.monto_pagado,
              moneda: s.moneda,
              observaciones: s.observaciones
            }))
          : [] // Array vacío si no hay servicios seleccionados
      };

      console.log('💾 Finalizando consulta:', request);

      const response = await this.serviciosService.finalizarConsultaConServicios(parseInt(this.consultaId), request).toPromise();
      
      if (response && response.success) {
        console.log('✅ Consulta finalizada exitosamente');
        // Redirigir al dashboard con mensaje de éxito
        this.router.navigate(['/admin/dashboard'], { 
          queryParams: { success: 'consulta-finalizada' } 
        });
      } else {
        this.errorHandler.logError(response, 'finalizar consulta');
        alert('Error al finalizar la consulta. Por favor, intente nuevamente.');
      }
    } catch (error: any) {
      this.errorHandler.logError(error, 'finalizar consulta');
      
      let errorMessage = 'Error al finalizar la consulta. Por favor, intente nuevamente.';
      if (error.error && error.error.error) {
        errorMessage = `Error: ${error.error.error}`;
      }
      const safeErrorMessage = this.errorHandler.getSafeErrorMessage(error, 'finalizar consulta');
      alert(safeErrorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  volverAlDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'Sin hora';
    // Convertir formato 24h a 12h con AM/PM
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }
}
