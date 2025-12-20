import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { TemplateInforme } from '../../../../models/informe-medico.model';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './template-detail.component.html',
  styleUrls: ['./template-detail.component.css']
})
export class TemplateDetailComponent implements OnInit {
  template: TemplateInforme | null = null;
  loading = false;
  error = '';

  constructor(
    private informeMedicoService: InformeMedicoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.cargarTemplate(id);
      }
    });
  }

  cargarTemplate(id: number) {
    this.loading = true;
    this.error = '';

    this.informeMedicoService.obtenerTemplate(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.template = response.data;
        } else {
          this.error = 'Error cargando plantilla';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando template:', error);
        this.error = 'Error de conexión al cargar plantilla';
        this.loading = false;
      }
    });
  }

  editarTemplate() {
    if (this.template?.id) {
      this.router.navigate(['/admin/informes-medicos/plantillas', this.template.id, 'editar']);
    }
  }

  eliminarTemplate() {
    if (this.template?.id && confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      this.informeMedicoService.eliminarTemplate(this.template.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/admin/informes-medicos/plantillas']);
          } else {
            alert('Error al eliminar la plantilla');
          }
        },
        error: (error) => {
          console.error('Error eliminando template:', error);
          alert('Error al eliminar la plantilla');
        }
      });
    }
  }

  volver() {
    this.router.navigate(['/admin/informes-medicos/plantillas']);
  }

  // Utilidades
  obtenerTipoInformeTexto(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'consulta': 'Consulta',
      'examen': 'Examen',
      'procedimiento': 'Procedimiento',
      'seguimiento': 'Seguimiento',
      'emergencia': 'Emergencia',
      'control': 'Control'
    };
    return tipos[tipo] || tipo;
  }

  obtenerEspecialidadNombre(especialidadId: number): string {
    // En un caso real, cargarías las especialidades
    return 'Especialidad ' + especialidadId;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}



