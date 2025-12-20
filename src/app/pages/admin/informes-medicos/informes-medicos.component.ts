import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InformeMedicoService } from '../../../services/informe-medico.service';
import { InformeMedico, FiltrosInformes, EstadisticasInformes } from '../../../models/informe-medico.model';

@Component({
  selector: 'app-informes-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes-medicos.component.html',
  styleUrls: ['./informes-medicos.component.css']
})
export class InformesMedicosComponent implements OnInit {
  informes: InformeMedico[] = [];
  estadisticas: EstadisticasInformes | null = null;
  filtros: FiltrosInformes = {};
  cargando = false;
  error = '';

  // Paginación
  paginaActual = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  registrosPorPagina = 10;

  // Filtros
  estados = [
    { valor: 'borrador', texto: 'Borrador' },
    { valor: 'finalizado', texto: 'Finalizado' },
    { valor: 'firmado', texto: 'Firmado' },
    { valor: 'enviado', texto: 'Enviado' }
  ];

  tiposInforme = [
    { valor: 'consulta', texto: 'Consulta Médica' },
    { valor: 'examen', texto: 'Examen Médico' },
    { valor: 'procedimiento', texto: 'Procedimiento' },
    { valor: 'seguimiento', texto: 'Seguimiento' },
    { valor: 'emergencia', texto: 'Emergencia' },
    { valor: 'control', texto: 'Control Médico' }
  ];

  constructor(
    private informeMedicoService: InformeMedicoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarInformes();
    this.cargarEstadisticas();
  }

  cargarInformes(): void {
    this.cargando = true;
    this.error = '';

    this.informeMedicoService.obtenerInformes(this.filtros).subscribe({
      next: (response) => {
        this.informes = response.data || [];
        this.totalRegistros = response.total || 0;
        this.totalPaginas = Math.ceil(this.totalRegistros / this.registrosPorPagina);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando informes:', error);
        this.error = 'Error cargando informes médicos';
        this.cargando = false;
      }
    });
  }

  cargarEstadisticas(): void {
    this.informeMedicoService.obtenerEstadisticas().subscribe({
      next: (response) => {
        this.estadisticas = response.data;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarInformes();
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.paginaActual = 1;
    this.cargarInformes();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarInformes();
    }
  }

  reenviarEmail(informe: InformeMedico): void {
    // Navegar a la pantalla de resumen donde se puede reenviar el email
    this.router.navigate(['/admin/informes-medicos', informe.id, 'resumen']);
  }

  editarInforme(informe: InformeMedico): void {
    if (informe.estado === 'firmado' || informe.estado === 'enviado') {
      alert('No se puede editar un informe que ya está firmado o enviado');
      return;
    }
    this.router.navigate(['/admin/informes-medicos', informe.id, 'editar']);
  }

  eliminarInforme(informe: InformeMedico): void {
    if (confirm(`¿Está seguro de que desea eliminar el informe "${informe.titulo}"?`)) {
      this.informeMedicoService.eliminarInforme(informe.id!).subscribe({
        next: () => {
          alert('Informe eliminado exitosamente');
          this.cargarInformes();
          this.cargarEstadisticas();
        },
        error: (error) => {
          console.error('Error eliminando informe:', error);
          alert('Error eliminando el informe');
        }
      });
    }
  }

  firmarInforme(informe: InformeMedico): void {
    if (informe.estado !== 'finalizado') {
      alert('Solo se pueden firmar informes que estén en estado "Finalizado"');
      return;
    }
    this.router.navigate(['/admin/informes-medicos', informe.id, 'firmar']);
  }

  enviarInforme(informe: InformeMedico): void {
    if (informe.estado !== 'firmado') {
      alert('Solo se pueden enviar informes que estén firmados');
      return;
    }
    this.router.navigate(['/admin/informes-medicos', informe.id, 'enviar']);
  }

  duplicarInforme(informe: InformeMedico): void {
    if (confirm(`¿Desea duplicar el informe "${informe.titulo}"?`)) {
      const informeDuplicado = {
        ...informe,
        titulo: `${informe.titulo} (Copia)`,
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
          this.cargarInformes();
        },
        error: (error) => {
          console.error('Error duplicando informe:', error);
          alert('Error duplicando el informe');
        }
      });
    }
  }

  exportarInforme(informe: InformeMedico): void {
    const contenido = this.informeMedicoService.exportarInforme(informe);
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `informe-${informe.numero_informe}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
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

  puedeEditar(informe: InformeMedico): boolean {
    return informe.estado === 'borrador' || informe.estado === 'finalizado';
  }

  puedeFirmar(informe: InformeMedico): boolean {
    return informe.estado === 'finalizado';
  }

  puedeEnviar(informe: InformeMedico): boolean {
    return informe.estado === 'firmado';
  }

  puedeEliminar(informe: InformeMedico): boolean {
    return informe.estado === 'borrador';
  }

  obtenerAccionesDisponibles(informe: InformeMedico): string[] {
    const acciones: string[] = ['ver'];
    
    if (this.puedeEditar(informe)) {
      acciones.push('editar');
    }
    
    if (this.puedeFirmar(informe)) {
      acciones.push('firmar');
    }
    
    if (this.puedeEnviar(informe)) {
      acciones.push('enviar');
    }
    
    if (this.puedeEliminar(informe)) {
      acciones.push('eliminar');
    }
    
    acciones.push('duplicar', 'exportar');
    
    return acciones;
  }
}
