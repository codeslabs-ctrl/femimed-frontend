import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService, Servicio, FinalizarConsultaRequest } from '../../services/servicios.service';

export interface ServicioSeleccionado {
  servicio_id: number;
  servicio_nombre: string;
  monto_base: number;        // Precio base del servicio
  monto_pagado: number;      // Precio real pagado (editable)
  moneda: 'VES' | 'USD' | 'EUR' | 'COP';
  observaciones?: string;
}

@Component({
  selector: 'app-finalizar-consulta-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalizar-consulta-modal.component.html',
  styleUrls: ['./finalizar-consulta-modal.component.css']
})
export class FinalizarConsultaModalComponent implements OnInit {
  @Input() consultaInfo: any = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<FinalizarConsultaRequest>();

  serviciosDisponibles: Servicio[] = [];
  serviciosSeleccionados: ServicioSeleccionado[] = [];
  isSubmitting = false;
  
  // Propiedades para cálculo de totales
  totalVES = 0;
  totalUSD = 0;
  tipoCambio = 36.50; // Tipo de cambio por defecto

  constructor(private serviciosService: ServiciosService) {}

  ngOnInit(): void {
    console.log('🔍 FinalizarConsultaModalComponent - ngOnInit');
    console.log('📋 consultaInfo recibida:', this.consultaInfo);
    console.log('📋 especialidad_id:', this.consultaInfo?.especialidad_id);
    
    if (this.consultaInfo?.especialidad_id) {
      console.log('✅ Especialidad ID encontrado, cargando servicios...');
      this.loadServiciosPorEspecialidad();
    } else {
      console.log('❌ No se encontró especialidad_id en consultaInfo');
    }
  }

  ngOnChanges(): void {
    console.log('🔍 FinalizarConsultaModalComponent - ngOnChanges');
    console.log('📋 consultaInfo actualizada:', this.consultaInfo);
    console.log('📋 especialidad_id:', this.consultaInfo?.especialidad_id);
    
    if (this.consultaInfo?.especialidad_id) {
      console.log('✅ Especialidad ID encontrado en ngOnChanges, cargando servicios...');
      this.loadServiciosPorEspecialidad();
    } else {
      console.log('❌ No se encontró especialidad_id en ngOnChanges');
    }
  }

  loadServiciosPorEspecialidad(): void {
    console.log('🔍 loadServiciosPorEspecialidad - Iniciando...');
    console.log('📋 especialidad_id a consultar:', this.consultaInfo?.especialidad_id);
    
    if (!this.consultaInfo?.especialidad_id) {
      console.log('❌ No hay especialidad_id, abortando carga de servicios');
      return;
    }

    console.log('🌐 Llamando a getServiciosPorEspecialidad...');
    this.serviciosService.getServiciosPorEspecialidad(this.consultaInfo.especialidad_id).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servicio:', response);
        this.serviciosDisponibles = response.data || [];
        console.log('📋 Servicios cargados:', this.serviciosDisponibles);
        console.log('📊 Cantidad de servicios:', this.serviciosDisponibles.length);
        
        if (this.serviciosDisponibles.length === 0) {
          console.log('⚠️  No hay servicios disponibles para esta especialidad');
        }
      },
      error: (error) => {
        console.error('❌ Error loading servicios:', error);
        console.error('❌ Detalles del error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        alert('❌ Error cargando servicios\n\nPor favor, intente nuevamente.');
      }
    });
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
        moneda: (servicioOriginal?.moneda as 'VES' | 'USD' | 'EUR' | 'COP') || 'VES',
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

  getTotalVES(): number {
    return this.serviciosSeleccionados
      .filter(s => s.moneda === 'VES')
      .reduce((total, s) => total + s.monto_pagado, 0);
  }

  getTotalUSD(): number {
    return this.serviciosSeleccionados
      .filter(s => s.moneda === 'USD')
      .reduce((total, s) => total + s.monto_pagado, 0);
  }

  canFinalizar(): boolean {
    return this.serviciosSeleccionados.length > 0 &&
           this.validarMontos();
  }

  finalizarConsulta(): void {
    if (!this.canFinalizar() || this.isSubmitting) return;

    this.isSubmitting = true;

    const request: FinalizarConsultaRequest = {
      servicios: this.serviciosSeleccionados.map(s => ({
        servicio_id: s.servicio_id,
        monto_pagado: s.monto_pagado,
        moneda: s.moneda,
        observaciones: s.observaciones
      }))
    };

    this.finalizar.emit(request);
  }

  closeModal(): void {
    this.close.emit();
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
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }
}
