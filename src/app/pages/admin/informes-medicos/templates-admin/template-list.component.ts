import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InformeMedicoService } from '../../../../services/informe-medico.service';
import { EspecialidadService } from '../../../../services/especialidad.service';
import { TemplateInforme, FiltrosTemplates } from '../../../../models/informe-medico.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.css']
})
export class TemplateListComponent implements OnInit {
  templates: TemplateInforme[] = [];
  especialidades: any[] = [];
  loading = false;
  error = '';

  // Filtros
  searchTerm = '';
  selectedEspecialidad = '';
  selectedTipo = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private informeMedicoService: InformeMedicoService,
    private especialidadService: EspecialidadService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarEspecialidades();
    this.cargarTemplates();
  }

  cargarEspecialidades() {
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.especialidades = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error cargando especialidades:', error);
      }
    });
  }

  cargarTemplates() {
    this.loading = true;
    this.error = '';

    const filtros: FiltrosTemplates = {};
    if (this.selectedEspecialidad) {
      filtros.especialidad_id = parseInt(this.selectedEspecialidad);
    }
    if (this.selectedTipo) {
      filtros.tipo_informe = this.selectedTipo;
    }

    this.informeMedicoService.obtenerTemplates(filtros).subscribe({
      next: (response) => {
        if (response.success) {
          this.templates = response.data || [];
          this.totalItems = this.templates.length;
          
          // Aplicar filtro de búsqueda local
          if (this.searchTerm) {
            this.templates = this.templates.filter(template =>
              template.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
              template.descripcion?.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
          }
        } else {
          this.error = 'Error cargando plantillas';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando templates:', error);
        this.error = 'Error de conexión al cargar plantillas';
        this.loading = false;
      }
    });
  }

  onSearchChange() {
    this.cargarTemplates();
  }

  onEspecialidadChange() {
    this.cargarTemplates();
  }

  onTipoChange() {
    this.cargarTemplates();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedEspecialidad = '';
    this.selectedTipo = '';
    this.cargarTemplates();
  }

  // Navegación
  crearPlantilla() {
    this.router.navigate(['/admin/informes-medicos/plantillas/nueva']);
  }

  verPlantilla(id: number) {
    this.router.navigate(['/admin/informes-medicos/plantillas', id]);
  }

  editarPlantilla(id: number) {
    this.router.navigate(['/admin/informes-medicos/plantillas', id, 'editar']);
  }

  eliminarPlantilla(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      this.informeMedicoService.eliminarTemplate(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarTemplates();
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
    const especialidad = this.especialidades.find(e => e.id === especialidadId);
    return especialidad ? especialidad.nombre_especialidad : 'Sin especialidad';
  }

  // Paginación
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedTemplates(): TemplateInforme[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.templates.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
