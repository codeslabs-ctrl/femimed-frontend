import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspecialidadService, Especialidad } from '../../../services/especialidad.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './especialidades.component.html',
  styleUrls: ['./especialidades.component.css']
})
export class EspecialidadesComponent implements OnInit {
  especialidades: Especialidad[] = [];
  filteredEspecialidades: Especialidad[] = [];
  loading = true;
  showModal = false;
  isEditing = false;
  saving = false;
  searchName = '';
  errorMessage = '';
  
  // Modal de confirmación eliminar
  showConfirmModal: boolean = false;
  especialidadToDelete: Especialidad | null = null;

  especialidadData: Especialidad = {
    nombre_especialidad: '',
    descripcion: ''
  };

  constructor(
    private especialidadService: EspecialidadService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.loadEspecialidades();
  }

  loadEspecialidades() {
    this.loading = true;
    this.especialidadService.getAllEspecialidades().subscribe({
      next: (response) => {
        if (response.success) {
          this.especialidades = response.data;
          this.filteredEspecialidades = [...this.especialidades];
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar especialidades');
        this.loading = false;
      }
    });
  }

  onSearchChange() {
    if (!this.searchName.trim()) {
      this.filteredEspecialidades = [...this.especialidades];
      return;
    }

    this.filteredEspecialidades = this.especialidades.filter(especialidad =>
      especialidad.nombre_especialidad.toLowerCase().includes(this.searchName.toLowerCase()) ||
      especialidad.descripcion.toLowerCase().includes(this.searchName.toLowerCase())
    );
  }

  clearFilters() {
    this.searchName = '';
    this.filteredEspecialidades = [...this.especialidades];
  }

  openAddModal() {
    this.isEditing = false;
    this.especialidadData = {
      nombre_especialidad: '',
      descripcion: ''
    };
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(especialidad: Especialidad) {
    this.isEditing = true;
    this.especialidadData = { ...especialidad };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.errorMessage = '';
    this.especialidadData = {
      nombre_especialidad: '',
      descripcion: ''
    };
  }

  onSubmit() {
    // Limpiar mensaje de error anterior
    this.errorMessage = '';
    
    // La validación se hace automáticamente por Angular Forms
    // El botón está deshabilitado si el formulario es inválido
    // Si el formulario es válido, proceder con la acción
    if (this.isEditing) {
      this.updateEspecialidad();
    } else {
      this.createEspecialidad();
    }
  }

  createEspecialidad() {
    this.saving = true;
    this.errorMessage = '';
    
    this.especialidadService.createEspecialidad(this.especialidadData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadEspecialidades();
          this.closeModal();
        } else {
          this.errorMessage = response.error?.message || 'Error al crear la especialidad';
          this.saving = false;
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'crear especialidad');
        const errorMsg = this.errorHandler.getSafeErrorMessage(error, 'crear especialidad');
        this.errorMessage = errorMsg;
        this.saving = false;
      }
    });
  }

  updateEspecialidad() {
    this.saving = true;
    this.errorMessage = '';
    
    this.especialidadService.updateEspecialidad(this.especialidadData.id!, this.especialidadData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadEspecialidades();
          this.closeModal();
        } else {
          this.errorMessage = response.error?.message || 'Error al actualizar la especialidad';
          this.saving = false;
        }
      },
      error: (error) => {
        this.errorHandler.logError(error, 'actualizar especialidad');
        const errorMsg = this.errorHandler.getSafeErrorMessage(error, 'actualizar especialidad');
        this.errorMessage = errorMsg;
        this.saving = false;
      }
    });
  }

  deleteEspecialidad(especialidad: Especialidad) {
    this.especialidadToDelete = especialidad;
    this.showConfirmModal = true;
  }

  onConfirmDelete() {
    if (this.especialidadToDelete) {
      this.especialidadService.deleteEspecialidad(this.especialidadToDelete.id!).subscribe({
        next: (response) => {
          if (response.success) {
            const mensaje = response.data?.message || 
              `Especialidad "${this.especialidadToDelete?.nombre_especialidad}" eliminada exitosamente.`;
            alert(`✅ ${mensaje}`);
            this.loadEspecialidades();
            this.closeConfirmModal();
          } else {
            // Si la respuesta no es exitosa pero no es un error HTTP
            const errorMsg = response.error?.message || 'Error al eliminar la especialidad';
            alert(`❌ ${errorMsg}`);
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'eliminar especialidad');
          
          // Intentar extraer el mensaje específico del backend
          let errorMessage = 'Error al eliminar la especialidad';
          
          // El backend devuelve: { error: { success: false, error: { message: "...", code: "..." } } }
          if (error?.error?.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = this.errorHandler.getSafeErrorMessage(error, 'eliminar especialidad');
          }
          
          alert(`❌ ${errorMessage}`);
        }
      });
    }
  }

  onCancelDelete() {
    this.closeConfirmModal();
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.especialidadToDelete = null;
  }
}
