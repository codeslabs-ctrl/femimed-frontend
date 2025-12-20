import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { InformeMedico, AnexoInforme, EnvioInforme, FirmaDigital } from '../../../../models/informe-medico.model';

@Component({
  selector: 'app-informe-medico-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe-medico-detail.component.html',
  styleUrls: ['./informe-medico-detail.component.css']
})
export class InformeMedicoDetailComponent implements OnInit {
  informe: InformeMedico | null = null;
  anexos: AnexoInforme[] = [];
  envios: EnvioInforme[] = [];
  firmaDigital: FirmaDigital | null = null;
  
  cargando = false;
  error = '';
  informeId: number | null = null;

  // Tabs
  tabActivo = 'detalle';

  constructor(
    private informeMedicoService: InformeMedicoService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.informeId = parseInt(params['id']);
        this.cargarInforme();
      }
    });
  }

  cargarInforme(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.error = '';

    this.informeMedicoService.obtenerInformePorId(this.informeId).subscribe({
      next: (response) => {
        this.informe = response.data;
        this.cargarAnexos();
        this.cargarEnvios();
        this.verificarFirmaDigital();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando informe:', error);
        this.error = 'Error cargando el informe médico';
        this.cargando = false;
      }
    });
  }

  cargarAnexos(): void {
    if (!this.informeId) return;

    this.informeMedicoService.obtenerAnexosPorInforme(this.informeId).subscribe({
      next: (response) => {
        this.anexos = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando anexos:', error);
      }
    });
  }

  cargarEnvios(): void {
    if (!this.informeId) return;

    this.informeMedicoService.obtenerEnviosPorInforme(this.informeId).subscribe({
      next: (response) => {
        this.envios = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando envíos:', error);
      }
    });
  }

  verificarFirmaDigital(): void {
    if (!this.informeId) return;

    this.informeMedicoService.verificarFirmaDigital(this.informeId).subscribe({
      next: (response) => {
        this.firmaDigital = response.data;
      },
      error: (error) => {
        console.error('Error verificando firma digital:', error);
      }
    });
  }

  editarInforme(): void {
    if (!this.informe) return;

    if (this.informe.estado === 'firmado' || this.informe.estado === 'enviado') {
      alert('No se puede editar un informe que ya está firmado o enviado');
      return;
    }

    this.router.navigate(['/admin/informes-medicos', this.informe.id, 'editar']);
  }

  firmarInforme(): void {
    if (!this.informe) return;

    if (this.informe.estado !== 'finalizado') {
      alert('Solo se pueden firmar informes que estén en estado "Finalizado"');
      return;
    }

    this.router.navigate(['/admin/informes-medicos', this.informe.id, 'firmar']);
  }

  enviarInforme(): void {
    if (!this.informe) return;

    if (this.informe.estado !== 'firmado') {
      alert('Solo se pueden enviar informes que estén firmados');
      return;
    }

    this.router.navigate(['/admin/informes-medicos', this.informe.id, 'enviar']);
  }

  eliminarInforme(): void {
    if (!this.informe) return;

    if (this.informe.estado !== 'borrador') {
      alert('Solo se pueden eliminar informes en estado "Borrador"');
      return;
    }

    if (confirm(`¿Está seguro de que desea eliminar el informe "${this.informe.titulo}"?`)) {
      this.informeMedicoService.eliminarInforme(this.informe.id!).subscribe({
        next: () => {
          alert('Informe eliminado exitosamente');
          this.router.navigate(['/admin/informes-medicos']);
        },
        error: (error) => {
          console.error('Error eliminando informe:', error);
          alert('Error eliminando el informe');
        }
      });
    }
  }

  duplicarInforme(): void {
    if (!this.informe) return;

    if (confirm(`¿Desea duplicar el informe "${this.informe.titulo}"?`)) {
      const informeDuplicado = {
        ...this.informe,
        titulo: `${this.informe.titulo} (Copia)`,
        estado: 'borrador' as const,
        fecha_emision: new Date().toISOString()
      };
      delete informeDuplicado.id;
      delete (informeDuplicado as any).numero_informe;
      delete (informeDuplicado as any).fecha_creacion;
      delete (informeDuplicado as any).fecha_actualizacion;

      this.informeMedicoService.crearInforme(informeDuplicado).subscribe({
        next: () => {
          alert('Informe duplicado exitosamente');
          this.router.navigate(['/admin/informes-medicos']);
        },
        error: (error) => {
          console.error('Error duplicando informe:', error);
          alert('Error duplicando el informe');
        }
      });
    }
  }

  exportarInforme(): void {
    if (!this.informe) return;

    const contenido = this.informeMedicoService.exportarInforme(this.informe);
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `informe-${this.informe.numero_informe}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  imprimirInforme(): void {
    if (!this.informe) return;

    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(this.generarHTMLImpresion());
      ventanaImpresion.document.close();
      ventanaImpresion.print();
    }
  }

  generarHTMLImpresion(): string {
    if (!this.informe) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.informe.titulo}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 15px; 
            margin-bottom: 30px; 
          }
          .info { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 25px; 
            border-left: 4px solid #007bff;
          }
          .contenido { 
            line-height: 1.8; 
            margin-bottom: 30px;
            white-space: pre-wrap;
          }
          .footer { 
            margin-top: 40px; 
            border-top: 2px solid #dee2e6; 
            padding-top: 15px; 
            font-size: 0.9em; 
            color: #6c757d; 
            text-align: center;
          }
          .firma-section {
            margin-top: 40px;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
          }
          .firma-digital {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #28a745;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #007bff; margin: 0;">${this.informe.titulo}</h1>
          <p style="margin: 5px 0; font-size: 1.1em;"><strong>Número:</strong> ${this.informe.numero_informe}</p>
        </div>
        
        <div class="info">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 5px 0;"><strong>Paciente:</strong> ${this.informe.pacientes?.nombres} ${this.informe.pacientes?.apellidos}</p>
              <p style="margin: 5px 0;"><strong>Cédula:</strong> ${this.informe.pacientes?.cedula}</p>
            </div>
            <div>
              <p style="margin: 5px 0;"><strong>Médico:</strong> ${this.informe.medicos?.nombres} ${this.informe.medicos?.apellidos}</p>
              <p style="margin: 5px 0;"><strong>Fecha:</strong> ${this.informeMedicoService.formatearFecha(this.informe.fecha_emision)}</p>
            </div>
          </div>
          <p style="margin: 10px 0 0 0;"><strong>Tipo:</strong> ${this.informeMedicoService.obtenerTipoInformeTexto(this.informe.tipo_informe)}</p>
          <p style="margin: 5px 0;"><strong>Estado:</strong> ${this.informeMedicoService.obtenerEstadoTexto(this.informe.estado)}</p>
        </div>
        
        <div class="contenido">
          <h3 style="color: #007bff; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Contenido del Informe:</h3>
          <div>${this.informe.contenido}</div>
        </div>
        
        ${this.informe.observaciones ? `
        <div class="info">
          <h4 style="color: #007bff; margin-top: 0;">Observaciones:</h4>
          <p style="margin: 0;">${this.informe.observaciones}</p>
        </div>
        ` : ''}
        
        ${this.firmaDigital?.valida ? `
        <div class="firma-section">
          <div class="firma-digital">
            <h4 style="color: #28a745; margin-top: 0;">✓ Firma Digital Válida</h4>
            <p style="margin: 5px 0;"><strong>Fecha de Firma:</strong> ${this.informeMedicoService.formatearFecha(this.firmaDigital.fecha_firma)}</p>
            <p style="margin: 5px 0;"><strong>Hash de Firma:</strong> ${this.firmaDigital.firma_hash}</p>
          </div>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Generado el: ${new Date().toLocaleString('es-ES')}</p>
          <p>DemoMed - Sistema de Gestión Médica</p>
        </div>
      </body>
      </html>
    `;
  }

  cambiarTab(tab: string): void {
    this.tabActivo = tab;
  }

  obtenerEstadoColor(estado: string): string {
    return this.informeMedicoService.obtenerEstadoColor(estado);
  }

  obtenerEstadoTexto(estado: string): string {
    return this.informeMedicoService.obtenerEstadoTexto(estado);
  }

  obtenerTipoInformeTexto(tipo: string): string {
    return this.informeMedicoService.obtenerTipoInformeTexto(tipo);
  }

  formatearFecha(fecha: string): string {
    return this.informeMedicoService.formatearFecha(fecha);
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      'borrador': 'badge-secondary',
      'finalizado': 'badge-primary',
      'firmado': 'badge-success',
      'enviado': 'badge-info'
    };
    return clases[estado] || 'badge-secondary';
  }

  puedeEditar(): boolean {
    return this.informe ? (this.informe.estado === 'borrador' || this.informe.estado === 'finalizado') : false;
  }

  puedeFirmar(): boolean {
    return this.informe ? this.informe.estado === 'finalizado' : false;
  }

  puedeEnviar(): boolean {
    return this.informe ? this.informe.estado === 'firmado' : false;
  }

  puedeEliminar(): boolean {
    return this.informe ? this.informe.estado === 'borrador' : false;
  }

  obtenerAccionesDisponibles(): string[] {
    const acciones: string[] = ['exportar', 'imprimir', 'duplicar'];
    
    if (this.puedeEditar()) {
      acciones.push('editar');
    }
    
    if (this.puedeFirmar()) {
      acciones.push('firmar');
    }
    
    if (this.puedeEnviar()) {
      acciones.push('enviar');
    }
    
    if (this.puedeEliminar()) {
      acciones.push('eliminar');
    }
    
    return acciones;
  }

  volver(): void {
    this.router.navigate(['/admin/informes-medicos/lista']);
  }

  descargarAnexo(anexo: AnexoInforme): void {
    // Implementar descarga de anexo
    console.log('Descargando anexo:', anexo.nombre_archivo);
  }
}
