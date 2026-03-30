import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AntecedenteTipoService } from '../../../services/antecedente-tipo.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import {
  AntecedenteMedicoTipo,
  AntecedenteTipoEnum,
  RequiereDetalleEnum,
  ANTECEDENTE_TIPO_LABELS,
  REQUIERE_DETALLE_LABELS
} from '../../../models/antecedente-tipo.model';

@Component({
  selector: 'app-antecedentes',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './antecedentes.component.html',
  styleUrls: ['./antecedentes.component.css']
})
export class AntecedentesComponent implements OnInit {
  @ViewChild('antecedenteForm') antecedenteForm!: NgForm;

  items: AntecedenteMedicoTipo[] = [];
  filteredItems: AntecedenteMedicoTipo[] = [];
  loading = true;
  showModal = false;
  isEditing = false;
  saving = false;
  filterTipo = '';
  searchName = '';
  errorMessage = '';
  showConfirmModal = false;
  itemToDelete: AntecedenteMedicoTipo | null = null;

  /** Opciones del desplegable Tipo: etiquetas desde antecedentes_tipo_label (API), con respaldo local. */
  tipoOptions: { value: string; label: string }[] = [];
  private tipoLabelByCodigo: Record<string, string> = { ...ANTECEDENTE_TIPO_LABELS };

  readonly detalleOptions: { value: RequiereDetalleEnum; label: string }[] = (
    Object.entries(REQUIERE_DETALLE_LABELS) as [RequiereDetalleEnum, string][]
  ).map(([value, label]) => ({ value, label }));

  antecedenteData: Partial<AntecedenteMedicoTipo> = {
    tipo: 'antecedentes_medicos',
    nombre: '',
    requiere_detalle: 'ninguno',
    orden: 0,
    activo: true
  };

  constructor(
    private antecedenteTipoService: AntecedenteTipoService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.setTipoOptionsFallback();
    this.loadCategoriaLabels();
    this.loadItems();
  }

  private setTipoOptionsFallback(): void {
    this.tipoOptions = (Object.entries(ANTECEDENTE_TIPO_LABELS) as [string, string][]).map(([value, label]) => ({
      value,
      label
    }));
    this.tipoLabelByCodigo = { ...ANTECEDENTE_TIPO_LABELS };
  }

  private loadCategoriaLabels(): void {
    this.antecedenteTipoService.getCategoriaLabels().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.tipoOptions = res.data.map((r) => ({ value: r.codigo, label: r.etiqueta }));
          this.tipoLabelByCodigo = Object.fromEntries(res.data.map((r) => [r.codigo, r.etiqueta]));
        }
      },
      error: (err) => this.errorHandler.logError(err, 'cargar etiquetas de categoría antecedentes')
    });
  }

  loadItems() {
    this.loading = true;
    this.antecedenteTipoService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.items = response.data;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'cargar antecedentes');
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let result = [...this.items];
    if (this.filterTipo) {
      result = result.filter((i) => i.tipo === this.filterTipo);
    }
    if (this.searchName.trim()) {
      const q = this.searchName.toLowerCase();
      result = result.filter((i) => i.nombre?.toLowerCase().includes(q));
    }
    result.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    this.filteredItems = result;
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filterTipo = '';
    this.searchName = '';
    this.applyFilters();
  }

  getTipoLabel(tipo: string): string {
    return this.tipoLabelByCodigo[tipo] ?? ANTECEDENTE_TIPO_LABELS[tipo as AntecedenteTipoEnum] ?? tipo;
  }

  getDetalleLabel(detalle: RequiereDetalleEnum): string {
    return REQUIERE_DETALLE_LABELS[detalle] ?? detalle;
  }

  openAddModal() {
    this.isEditing = false;
    this.saving = false;
    this.errorMessage = '';
    this.antecedenteData = {
      tipo: 'antecedentes_medicos',
      nombre: '',
      requiere_detalle: 'ninguno',
      orden: this.getNextOrden(),
      activo: true
    };
    this.showModal = true;
  }

  getNextOrden(): number {
    if (this.items.length === 0) return 1;
    const max = Math.max(...this.items.map((i) => i.orden ?? 0));
    return max + 1;
  }

  openEditModal(item: AntecedenteMedicoTipo) {
    this.isEditing = true;
    this.saving = false;
    this.errorMessage = '';
    this.antecedenteData = { ...item };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.saving = false;
    this.errorMessage = '';
  }

  onSubmit() {
    if (!this.antecedenteData.nombre?.trim()) {
      this.antecedenteForm?.controls['nombre']?.markAsTouched();
      return;
    }
    if (this.isEditing && this.antecedenteData.id != null) {
      this.updateItem();
    } else {
      this.createItem();
    }
  }

  createItem() {
    this.saving = true;
    this.errorMessage = '';
    const payload = {
      tipo: this.antecedenteData.tipo!,
      nombre: this.antecedenteData.nombre!.trim(),
      requiere_detalle: this.antecedenteData.requiere_detalle ?? 'ninguno',
      orden: this.antecedenteData.orden ?? 0,
      activo: this.antecedenteData.activo ?? true
    };
    this.antecedenteTipoService.create(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadItems();
          this.closeModal();
        } else {
          this.errorMessage = (response as any).error?.message || 'Error al crear';
        }
        this.saving = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'crear antecedente');
        this.errorMessage = error.error?.message || error.error?.error?.message || 'Error al crear. Intente de nuevo.';
        this.saving = false;
      }
    });
  }

  updateItem() {
    this.saving = true;
    this.errorMessage = '';
    const id = this.antecedenteData.id!;
    const payload = {
      tipo: this.antecedenteData.tipo,
      nombre: this.antecedenteData.nombre?.trim(),
      requiere_detalle: this.antecedenteData.requiere_detalle,
      orden: this.antecedenteData.orden,
      activo: this.antecedenteData.activo
    };
    this.antecedenteTipoService.update(id, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadItems();
          this.closeModal();
        } else {
          this.errorMessage = (response as any).error?.message || 'Error al actualizar';
        }
        this.saving = false;
      },
      error: (error) => {
        this.errorHandler.logError(error, 'actualizar antecedente');
        this.errorMessage = error.error?.message || error.error?.error?.message || 'Error al actualizar. Intente de nuevo.';
        this.saving = false;
      }
    });
  }

  deleteItem(item: AntecedenteMedicoTipo) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

  onConfirmDelete() {
    if (this.itemToDelete?.id != null) {
      this.antecedenteTipoService.delete(this.itemToDelete.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadItems();
            this.closeConfirmModal();
          }
        },
        error: (error) => this.errorHandler.logError(error, 'eliminar antecedente')
      });
    }
  }

  onCancelDelete() {
    this.closeConfirmModal();
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
}
