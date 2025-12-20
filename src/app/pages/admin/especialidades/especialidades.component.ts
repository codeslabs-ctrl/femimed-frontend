import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
  @ViewChild('especialidadForm') especialidadForm!: NgForm;

  especialidades: Especialidad[] = [];
  filteredEspecialidades: Especialidad[] = [];
  loading = true;
  showModal = false;
  isEditing = false;
  saving = false;
  searchName = '';
  errorMessage: string = '';
  
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
    this.saving = false;
    this.errorMessage = '';
    this.especialidadData = {
      nombre_especialidad: '',
      descripcion: ''
    };
    this.showModal = true;
  }

  openEditModal(especialidad: Especialidad) {
    this.isEditing = true;
    this.saving = false;
    this.errorMessage = '';
    this.especialidadData = { ...especialidad };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.saving = false;
    this.errorMessage = '';
    this.especialidadData = {
      nombre_especialidad: '',
      descripcion: ''
    };
  }

  onSubmit() {
    // Validar que los campos no estén vacíos
    if (!this.especialidadData.nombre_especialidad?.trim() || !this.especialidadData.descripcion?.trim()) {
      // Marcar campos como touched para mostrar errores
      if (this.especialidadForm) {
        Object.keys(this.especialidadForm.controls).forEach(key => {
          this.especialidadForm.controls[key].markAsTouched();
        });
      }
      return;
    }

    // Validar longitud mínima
    if (this.especialidadData.nombre_especialidad.trim().length < 2) {
      if (this.especialidadForm) {
        this.especialidadForm.controls['nombre']?.markAsTouched();
      }
      return;
    }

    if (this.especialidadData.descripcion.trim().length < 5) {
      if (this.especialidadForm) {
        this.especialidadForm.controls['descripcion']?.markAsTouched();
      }
      return;
    }

    if (this.isEditing) {
      this.updateEspecialidad();
    } else {
      this.createEspecialidad();
    }
  }

  isFormValid(): boolean {
    if (!this.especialidadData.nombre_especialidad?.trim() || !this.especialidadData.descripcion?.trim()) {
      return false;
    }
    
    if (this.especialidadData.nombre_especialidad.trim().length < 2) {
      return false;
    }

    if (this.especialidadData.descripcion.trim().length < 5) {
      return false;
    }

    return true;
  }

  isNombreInvalid(): boolean {
    if (!this.especialidadForm) return false;
    const control = this.especialidadForm.controls['nombre'];
    return control ? (control.touched && control.invalid) : false;
  }

  isDescripcionInvalid(): boolean {
    if (!this.especialidadForm) return false;
    const control = this.especialidadForm.controls['descripcion'];
    return control ? (control.touched && control.invalid) : false;
  }

  getNombreErrors(): string | null {
    if (!this.especialidadForm) return null;
    const control = this.especialidadForm.controls['nombre'];
    if (!control || !control.touched || !control.invalid) return null;
    
    if (control.errors?.['required']) return 'El nombre es requerido';
    if (control.errors?.['minlength']) return 'El nombre debe tener al menos 2 caracteres';
    if (control.errors?.['maxlength']) return 'El nombre no puede exceder 100 caracteres';
    return null;
  }

  getDescripcionErrors(): string | null {
    if (!this.especialidadForm) return null;
    const control = this.especialidadForm.controls['descripcion'];
    if (!control || !control.touched || !control.invalid) return null;
    
    if (control.errors?.['required']) return 'La descripción es requerida';
    if (control.errors?.['minlength']) return 'La descripción debe tener al menos 5 caracteres';
    if (control.errors?.['maxlength']) return 'La descripción no puede exceder 500 caracteres';
    return null;
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
        // Extraer mensaje de error del response (ya viene genérico del backend)
        if (error.error?.error?.message) {
          this.errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al crear la especialidad. Por favor, intente nuevamente.';
        }
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
        // Extraer mensaje de error del response (ya viene genérico del backend)
        if (error.error?.error?.message) {
          this.errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al actualizar la especialidad. Por favor, intente nuevamente.';
        }
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
            this.loadEspecialidades();
            this.closeConfirmModal();
          }
        },
        error: (error) => {
          this.errorHandler.logError(error, 'eliminar especialidad');
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
