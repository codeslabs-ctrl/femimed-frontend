import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { InformeMedicoService } from '../../../services/informe-medico.service';
import { EstadisticasInformes } from '../../../models/informe-medico.model';

@Component({
  selector: 'app-reportes-informes',
  templateUrl: './reportes-informes.component.html',
  styleUrls: ['./reportes-informes.component.css']
})
export class ReportesInformesComponent implements OnInit {
  reporteForm: FormGroup;
  estadisticas: EstadisticasInformes | null = null;
  reporteData: any = null;
  cargando = false;
  error = '';

  // Tipos de reportes
  tiposReporte = [
    { valor: 'general', texto: 'Reporte General', icono: 'fas fa-chart-pie' },
    { valor: 'por-medico', texto: 'Por Médico', icono: 'fas fa-user-md' },
    { valor: 'por-tipo', texto: 'Por Tipo de Informe', icono: 'fas fa-tags' },
    { valor: 'por-fecha', texto: 'Por Período', icono: 'fas fa-calendar' },
    { valor: 'firmas', texto: 'Estado de Firmas', icono: 'fas fa-signature' },
    { valor: 'envios', texto: 'Envíos y Entregas', icono: 'fas fa-paper-plane' }
  ];

  // Períodos predefinidos
  periodos = [
    { valor: 'hoy', texto: 'Hoy' },
    { valor: 'ayer', texto: 'Ayer' },
    { valor: 'semana', texto: 'Esta Semana' },
    { valor: 'mes', texto: 'Este Mes' },
    { valor: 'trimestre', texto: 'Este Trimestre' },
    { valor: 'año', texto: 'Este Año' },
    { valor: 'personalizado', texto: 'Período Personalizado' }
  ];

  constructor(
    private fb: FormBuilder,
    private informeMedicoService: InformeMedicoService
  ) {
    this.reporteForm = this.fb.group({
      tipo_reporte: ['general'],
      periodo: ['mes'],
      fecha_desde: [''],
      fecha_hasta: [''],
      medico_id: [''],
      tipo_informe: [''],
      incluir_detalles: [true],
      formato: ['pantalla']
    });
  }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.cargando = true;
    this.error = '';

    this.informeMedicoService.obtenerEstadisticas().subscribe({
      next: (response) => {
        this.estadisticas = response.data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.error = 'Error cargando estadísticas';
        this.cargando = false;
      }
    });
  }

  generarReporte(): void {
    if (this.reporteForm.invalid) {
      return;
    }

    this.cargando = true;
    this.error = '';

    const formData = this.reporteForm.value;
    
    // Simular generación de reporte
    setTimeout(() => {
      this.reporteData = this.simularDatosReporte(formData);
      this.cargando = false;
    }, 2000);
  }

  simularDatosReporte(formData: any): any {
    const tipo = formData.tipo_reporte;
    
    switch (tipo) {
      case 'general':
        return {
          tipo: 'general',
          titulo: 'Reporte General de Informes',
          resumen: {
            total_informes: this.estadisticas?.total_informes || 0,
            informes_firmados: this.estadisticas?.informes_firmados || 0,
            informes_sin_firma: this.estadisticas?.informes_sin_firma || 0,
            porcentaje_firmados: this.estadisticas?.porcentaje_firmados || 0
          },
          graficos: [
            { tipo: 'pie', datos: this.generarDatosGraficoPie() },
            { tipo: 'bar', datos: this.generarDatosGraficoBar() }
          ]
        };
      
      case 'por-medico':
        return {
          tipo: 'por-medico',
          titulo: 'Reporte por Médico',
          datos: this.generarDatosPorMedico()
        };
      
      case 'por-tipo':
        return {
          tipo: 'por-tipo',
          titulo: 'Reporte por Tipo de Informe',
          datos: this.generarDatosPorTipo()
        };
      
      case 'por-fecha':
        return {
          tipo: 'por-fecha',
          titulo: 'Reporte por Período',
          datos: this.generarDatosPorFecha()
        };
      
      case 'firmas':
        return {
          tipo: 'firmas',
          titulo: 'Estado de Firmas Digitales',
          datos: this.generarDatosFirmas()
        };
      
      case 'envios':
        return {
          tipo: 'envios',
          titulo: 'Envíos y Entregas',
          datos: this.generarDatosEnvios()
        };
      
      default:
        return null;
    }
  }

  generarDatosGraficoPie(): any[] {
    return [
      { label: 'Firmados', value: this.estadisticas?.informes_firmados || 0, color: '#10b981' },
      { label: 'Sin Firma', value: this.estadisticas?.informes_sin_firma || 0, color: '#f59e0b' }
    ];
  }

  generarDatosGraficoBar(): any[] {
    return [
      { label: 'Ene', value: 15 },
      { label: 'Feb', value: 23 },
      { label: 'Mar', value: 18 },
      { label: 'Abr', value: 31 },
      { label: 'May', value: 27 },
      { label: 'Jun', value: 35 }
    ];
  }

  generarDatosPorMedico(): any[] {
    return [
      { medico: 'Dr. García', total: 45, firmados: 40, pendientes: 5 },
      { medico: 'Dr. López', total: 32, firmados: 28, pendientes: 4 },
      { medico: 'Dra. Martínez', total: 28, firmados: 25, pendientes: 3 },
      { medico: 'Dr. Rodríguez', total: 35, firmados: 30, pendientes: 5 }
    ];
  }

  generarDatosPorTipo(): any[] {
    return [
      { tipo: 'Consulta Médica', total: 65, porcentaje: 45.5 },
      { tipo: 'Examen Médico', total: 32, porcentaje: 22.4 },
      { tipo: 'Procedimiento', total: 28, porcentaje: 19.6 },
      { tipo: 'Seguimiento', total: 18, porcentaje: 12.6 }
    ];
  }

  generarDatosPorFecha(): any[] {
    return [
      { fecha: '2024-01', total: 15, firmados: 12 },
      { fecha: '2024-02', total: 23, firmados: 20 },
      { fecha: '2024-03', total: 18, firmados: 15 },
      { fecha: '2024-04', total: 31, firmados: 28 },
      { fecha: '2024-05', total: 27, firmados: 24 },
      { fecha: '2024-06', total: 35, firmados: 32 }
    ];
  }

  generarDatosFirmas(): any[] {
    return [
      { estado: 'Firmados', cantidad: this.estadisticas?.informes_firmados || 0, color: '#10b981' },
      { estado: 'Pendientes', cantidad: this.estadisticas?.informes_sin_firma || 0, color: '#f59e0b' },
      { estado: 'Enviados', cantidad: 25, color: '#3b82f6' },
      { estado: 'Entregados', cantidad: 20, color: '#8b5cf6' }
    ];
  }

  generarDatosEnvios(): any[] {
    return [
      { metodo: 'Email', total: 45, exitosos: 42, fallidos: 3 },
      { metodo: 'WhatsApp', total: 28, exitosos: 26, fallidos: 2 },
      { metodo: 'SMS', total: 15, exitosos: 14, fallidos: 1 },
      { metodo: 'Presencial', total: 12, exitosos: 12, fallidos: 0 }
    ];
  }

  exportarReporte(formato: string): void {
    if (!this.reporteData) {
      alert('No hay datos de reporte para exportar');
      return;
    }

    switch (formato) {
      case 'pdf':
        this.exportarPDF();
        break;
      case 'excel':
        this.exportarExcel();
        break;
      case 'csv':
        this.exportarCSV();
        break;
      default:
        alert('Formato no soportado');
    }
  }

  exportarPDF(): void {
    // Implementar exportación a PDF
    console.log('Exportando a PDF:', this.reporteData);
    alert('Funcionalidad de exportación a PDF en desarrollo');
  }

  exportarExcel(): void {
    // Implementar exportación a Excel
    console.log('Exportando a Excel:', this.reporteData);
    alert('Funcionalidad de exportación a Excel en desarrollo');
  }

  exportarCSV(): void {
    // Implementar exportación a CSV
    console.log('Exportando a CSV:', this.reporteData);
    alert('Funcionalidad de exportación a CSV en desarrollo');
  }

  imprimirReporte(): void {
    if (!this.reporteData) {
      alert('No hay datos de reporte para imprimir');
      return;
    }

    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(this.generarHTMLImpresion());
      ventanaImpresion.document.close();
      ventanaImpresion.print();
    }
  }

  generarHTMLImpresion(): string {
    if (!this.reporteData) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.reporteData.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
          .resumen { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .tabla th, .tabla td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
          .tabla th { background-color: #f8f9fa; font-weight: 600; }
          .footer { margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 10px; font-size: 0.9em; color: #6c757d; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${this.reporteData.titulo}</h1>
          <p>Generado el: ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        ${this.reporteData.resumen ? `
        <div class="resumen">
          <h3>Resumen Ejecutivo</h3>
          <p><strong>Total de Informes:</strong> ${this.reporteData.resumen.total_informes}</p>
          <p><strong>Informes Firmados:</strong> ${this.reporteData.resumen.informes_firmados}</p>
          <p><strong>Informes Sin Firma:</strong> ${this.reporteData.resumen.informes_sin_firma}</p>
          <p><strong>Porcentaje de Firmados:</strong> ${this.reporteData.resumen.porcentaje_firmados}%</p>
        </div>
        ` : ''}
        
        ${this.reporteData.datos ? `
        <table class="tabla">
          <thead>
            <tr>
              ${Object.keys(this.reporteData.datos[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${this.reporteData.datos.map(item => `
              <tr>
                ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        
        <div class="footer">
          <p>DemoMed - Sistema de Gestión Médica</p>
          <p>Reporte generado automáticamente</p>
        </div>
      </body>
      </html>
    `;
  }

  limpiarReporte(): void {
    this.reporteData = null;
    this.reporteForm.reset({
      tipo_reporte: 'general',
      periodo: 'mes',
      fecha_desde: '',
      fecha_hasta: '',
      medico_id: '',
      tipo_informe: '',
      incluir_detalles: true,
      formato: 'pantalla'
    });
  }
}



